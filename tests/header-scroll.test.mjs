import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the sticky header becomes compact after scrolling", async () => {
  const source = await readFile("src/components/layout/Header.tsx", "utf8");

  assert.match(source, /const \[isCompact, setIsCompact\] = useState\(false\)/);
  assert.match(
    source,
    /window\.addEventListener\("scroll", updateCompactState/,
  );
  assert.match(source, /isCompact \? "h-\[3\.75rem\] sm:h-18"/);
  assert.match(source, /isCompact \? "h-9 sm:h-\[2\.625rem\]"/);
});
