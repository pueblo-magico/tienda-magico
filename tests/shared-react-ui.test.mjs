import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("el storefront consume directamente la biblioteca compartida de Pueblo Magico", async () => {
  const [packageJsonSource, npmConfig, rootLayout, tokens, sourcePaths] =
    await Promise.all([
      read("package.json"),
      read(".npmrc"),
      read("src/app/layout.tsx"),
      read("src/styles/tokens.css"),
      readdir("src", { recursive: true }),
    ]);
  const packageJson = JSON.parse(packageJsonSource);
  const componentSources = await Promise.all(
    sourcePaths
      .filter((path) => path.endsWith(".tsx"))
      .map((path) => read(`src/${path}`)),
  );

  assert.match(
    packageJson.dependencies["@pueblo-magico/react-ui"],
    /^\^0\.1\./,
  );
  assert.match(
    npmConfig,
    /@pueblo-magico:registry=https:\/\/npm\.pkg\.github\.com/,
  );
  assert.match(npmConfig, /_authToken=\$\{NODE_AUTH_TOKEN\}/);
  assert.match(rootLayout, /@pueblo-magico\/react-ui\/styles\.css/);
  assert.match(rootLayout, /<body[^>]+className=\{`[^`]*pm-ui/);
  assert.match(tokens, /--pm-font-sans:\s*var\(--font-jost\), sans-serif/);
  await assert.rejects(access("src/components/ui/Card.tsx"));
  for (const source of componentSources) {
    assert.doesNotMatch(source, /@\/components\/ui\/Card/);
  }
  assert.match(
    await read("src/app/ui-system/card/page.tsx"),
    /from "@pueblo-magico\/react-ui"/,
  );
});

test("el despliegue instala la dependencia privada sin persistir el token", async () => {
  const [dockerfile, buildArtifact, workflow] = await Promise.all([
    read("deploy/docker/storefront.Dockerfile"),
    read("deploy/manual/build-artifact.mjs"),
    read(".github/workflows/deploy.yml"),
  ]);

  assert.match(
    dockerfile,
    /COPY package\.json package-lock\.json \.npmrc \.\//,
  );
  assert.match(
    dockerfile,
    /RUN --mount=type=secret,id=npm_token,required=true[\s\S]+NODE_AUTH_TOKEN/,
  );
  assert.match(
    buildArtifact,
    /--secret["'],\s*["']id=npm_token,env=NODE_AUTH_TOKEN/,
  );
  assert.match(
    workflow,
    /NODE_AUTH_TOKEN: \$\{\{ secrets\.GH_PACKAGES_TOKEN \}\}/,
  );
});
