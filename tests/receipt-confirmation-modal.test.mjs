import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("la confirmación de recepción usa el Modal y Button compartidos", async () => {
  const source = await readFile(
    "src/features/orders/ReceiptConfirmationModal.tsx",
    "utf8",
  );
  assert.match(source, /from "@pueblo-magico\/react-ui"/);
  assert.match(source, /isOpen/);
  assert.match(source, /closeLabel=/);
  assert.match(source, /isDisabled=\{busy\}/);
  assert.match(source, /isLoading=\{busy\}/);
  assert.match(source, /role="alert"/);
});
