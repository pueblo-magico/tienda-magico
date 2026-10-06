import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("el storefront consume directamente la biblioteca compartida de Pueblo Magico", async () => {
  const [
    packageJsonSource,
    npmConfig,
    nextConfig,
    rootLayout,
    tokens,
    sourcePaths,
  ] = await Promise.all([
    read("package.json"),
    read(".npmrc"),
    read("next.config.ts"),
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
    /^\^0\.2\./,
  );
  assert.match(
    npmConfig,
    /@pueblo-magico:registry=https:\/\/npm\.pkg\.github\.com/,
  );
  assert.match(npmConfig, /_authToken=\$\{NODE_AUTH_TOKEN\}/);
  assert.match(rootLayout, /@pueblo-magico\/react-ui\/styles\.css/);
  assert.match(
    nextConfig,
    /optimizePackageImports:\s*\["@pueblo-magico\/react-ui"\]/,
  );
  assert.match(
    await read("src/components/ui/ClientAccordion.tsx"),
    /^"use client";[\s\S]+export \{ Accordion \} from "@pueblo-magico\/react-ui"/,
  );
  assert.match(rootLayout, /<body[^>]+className=\{`[^`]*pm-ui/);
  assert.match(tokens, /--pm-font-sans:\s*var\(--font-jost\), sans-serif/);
  const replacedComponents = [
    "src/components/ui/Accordion.tsx",
    "src/components/ui/Badge.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Card.tsx",
    "src/components/ui/Checkbox.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Modal.tsx",
    "src/components/ui/Select.tsx",
    "src/components/ui/Tabs.tsx",
    "src/components/ui/Textarea.tsx",
    "src/components/layout/Container.tsx",
    "src/components/layout/Section.tsx",
    "src/components/typography/Body.tsx",
    "src/components/typography/Caption.tsx",
    "src/components/typography/Eyebrow.tsx",
    "src/components/typography/PageTitle.tsx",
    "src/components/typography/SectionTitle.tsx",
    "src/components/cards/InfoCard.tsx",
    "src/components/cards/ImpactCard.tsx",
  ];
  await Promise.all(
    replacedComponents.map((path) => assert.rejects(access(path))),
  );
  for (const source of componentSources) {
    assert.doesNotMatch(
      source,
      /@\/components\/(?:ui\/(?:Accordion|Badge|Button|Card|Checkbox|Input|Modal|Select|Tabs|Textarea)|layout\/(?:Container|Section)|typography\/(?:Body|Caption|Eyebrow|PageTitle|SectionTitle)|cards\/(?:InfoCard|ImpactCard))"/,
    );
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
