import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(entryPath);
      return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
    }),
  );
  return files.flat();
}

test("PMG-354 uses Phosphor as the only application icon library", async () => {
  const [rootPackage, cmsPackage, files] = await Promise.all([
    readFile("package.json", "utf8").then(JSON.parse),
    readFile("apps/cms/package.json", "utf8").then(JSON.parse),
    Promise.all([sourceFiles("src"), sourceFiles("apps/cms/src")]).then(
      (files) => files.flat(),
    ),
  ]);

  assert.ok(rootPackage.dependencies["@phosphor-icons/react"]);
  assert.equal(rootPackage.dependencies["lucide-react"], undefined);
  assert.equal(cmsPackage.dependencies["lucide-react"], undefined);

  const lucideImports = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (source.includes('from "lucide-react"')) lucideImports.push(file);
  }
  assert.deepEqual(lucideImports, []);
});
