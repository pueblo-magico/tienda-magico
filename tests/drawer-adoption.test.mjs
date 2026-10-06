import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el carrito y ui-system consumen el Drawer compartido con cierre localizado", async () => {
  const [cartDrawer, demo, uiIndex, es, en] = await Promise.all([
    readFile("src/features/cart/components/CartDrawer.tsx", "utf8"),
    readFile("src/app/ui-system/drawer/DrawerDemo.tsx", "utf8"),
    readFile("src/components/ui/index.ts", "utf8"),
    readFile("messages/es.json", "utf8"),
    readFile("messages/en.json", "utf8"),
  ]);

  assert.match(cartDrawer, /Drawer[\s\S]*from "@pueblo-magico\/react-ui"/);
  assert.match(cartDrawer, /isOpen=\{isOpen\}/);
  assert.match(cartDrawer, /onOpenChange=/);
  assert.match(cartDrawer, /closeLabel=\{t\("close"\)\}/);
  assert.match(cartDrawer, /placement="end"/);
  assert.match(demo, /Drawer[\s\S]*from "@pueblo-magico\/react-ui"/);
  assert.doesNotMatch(uiIndex, /\.\/Drawer/);
  assert.equal(JSON.parse(es).cart.close, "Cerrar carrito");
  assert.equal(JSON.parse(en).cart.close, "Close cart");
});
