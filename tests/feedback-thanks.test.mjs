import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("el agradecimiento usa el Modal compartido y conserva su cierre localizado", async () => {
  const [source, es, en] = await Promise.all([
    readFile("src/features/orders/FeedbackThanksModal.tsx", "utf8"),
    readFile("messages/es.json", "utf8"),
    readFile("messages/en.json", "utf8"),
  ]);
  assert.match(source, /Modal[^\n]*from "@pueblo-magico\/react-ui"/);
  assert.match(source, /isOpen=\{open\}/);
  assert.match(source, /onOpenChange=/);
  assert.match(source, /closeLabel=\{t\("close"\)\}/);
  assert.ok(JSON.parse(es).orders.feedbackThanks.close);
  assert.ok(JSON.parse(en).orders.feedbackThanks.close);
});
