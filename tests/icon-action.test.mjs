import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../src/components/ui/Button.tsx";
import { IconAction } from "../src/components/ui/IconAction.tsx";

test("al cargar conserva la etiqueta y reemplaza el ícono con un indicador ocupado", () => {
  const html = renderToStaticMarkup(
    createElement(
      IconAction,
      {
        icon: createElement("span", null, "original-icon"),
        loading: true,
        disabled: true,
      },
      "Consultar estado",
    ),
  );
  assert.ok(html.includes("Consultar estado"));
  assert.ok(!html.includes("original-icon"));
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(html.includes("animate-spin"));
});

test("la acción con ícono conserva deshabilitado y usa etiqueta sin mayúsculas forzadas", () => {
  const html = renderToStaticMarkup(
    createElement(
      Button,
      { variant: "icon-label", disabled: true },
      "Consultar estado",
    ),
  );
  assert.ok(html.includes('disabled=""'));
  assert.ok(html.includes("flex-col"));
  assert.ok(!html.includes("uppercase"));
});
