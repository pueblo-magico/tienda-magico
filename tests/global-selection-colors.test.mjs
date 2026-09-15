import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("la selección de texto usa colores semánticos de alto contraste", async () => {
  const [tokens, globals] = await Promise.all([
    readFile("src/styles/tokens.css", "utf8"),
    readFile("src/styles/globals.css", "utf8"),
  ]);

  assert.match(tokens, /--selection-background:/);
  assert.match(tokens, /--selection-foreground:/);
  assert.match(
    globals,
    /::selection\s*{[\s\S]*background: var\(--selection-background\);[\s\S]*color: var\(--selection-foreground\);/,
  );
});
