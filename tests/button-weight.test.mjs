import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../src/components/ui/Button.tsx";

test("peso liviano combina con colores sin clases de peso contradictorias", () => {
  for (const variant of ["primary", "secondary", "ghost"]) {
    const html = renderToStaticMarkup(
      createElement(Button, { weight: "light", variant }, "Continuar"),
    );
    assert.ok(html.includes("font-light"));
    assert.ok(!html.includes("font-bold"));
    assert.ok(!html.includes('weight="light"'));
  }
});

test("mantiene peso predeterminado, tipo submit, deshabilitado y enlaces semánticos", () => {
  const html = renderToStaticMarkup(
    createElement(Button, { type: "submit", disabled: true }, "Enviar"),
  );
  assert.ok(html.includes("font-bold"));
  assert.ok(html.includes('type="submit"'));
  assert.ok(html.includes('disabled=""'));
  const link = renderToStaticMarkup(
    createElement(Button, { href: "/es/tienda", weight: "light" }, "Tienda"),
  );
  assert.ok(link.includes('href="/es/tienda"'));
  assert.ok(!link.includes('role="button"'));
});
