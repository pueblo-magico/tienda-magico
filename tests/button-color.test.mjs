import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../src/components/ui/Button.tsx";

test("el color es independiente de la variante y no se propaga al DOM", () => {
  for (const color of [
    "forest",
    "terracotta",
    "gold",
    "earth",
    "gray",
    "black",
    "white",
    "cream",
    "warm",
  ]) {
    for (const variant of [
      "primary",
      "secondary",
      "ghost",
      "link",
      "icon-label",
    ]) {
      const html = renderToStaticMarkup(
        createElement(Button, { color, variant, weight: "light" }, "Continuar"),
      );
      assert.ok(html.includes(`button-color-${color}`));
      assert.ok(!html.includes(`color="${color}"`));
      assert.ok(html.includes("font-light"));
    }
  }
});

test("conserva forest por defecto, deshabilitado y enlaces", () => {
  const html = renderToStaticMarkup(
    createElement(Button, { disabled: true }, "Continuar"),
  );
  assert.ok(html.includes("button-color-forest"));
  assert.ok(html.includes('disabled=""'));
  const link = renderToStaticMarkup(
    createElement(
      Button,
      { href: "/es/tienda", color: "terracotta" },
      "Tienda",
    ),
  );
  assert.ok(link.includes('href="/es/tienda"'));
  assert.ok(link.includes("button-color-terracotta"));
});
