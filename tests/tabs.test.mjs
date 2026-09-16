import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Tabs } from "../src/components/ui/Tabs.tsx";

test("la selección inicial muestra un único panel y vincula sus pestañas", () => {
  const html = renderToStaticMarkup(
    createElement(Tabs, {
      label: "Información",
      defaultValue: "second",
      items: [
        { id: "first", label: "Primero", content: "Contenido inicial" },
        { id: "second", label: "Segundo", content: "Contenido seleccionado" },
      ],
    }),
  );
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 1);
  assert.ok(html.includes("Contenido seleccionado"));
  assert.ok(!html.includes("Contenido inicial"));
  assert.ok(html.includes("aria-controls="));
  assert.ok(html.includes("aria-labelledby="));
  assert.ok(html.includes('data-slot="tab-indicator"'));
  assert.ok(html.includes("motion-reduce:transition-none"));
});

test("respeta selección controlada, etiqueta y pestañas deshabilitadas", () => {
  const html = renderToStaticMarkup(
    createElement(Tabs, {
      label: "Estados de pedidos",
      value: "paid",
      items: [
        { id: "all", label: "Todos", content: "Todos los pedidos" },
        { id: "paid", label: "Pagados", content: "Pedidos pagados" },
        {
          id: "disabled",
          label: "No disponible",
          content: "No disponible",
          disabled: true,
        },
      ],
    }),
  );
  assert.ok(html.includes('aria-label="Estados de pedidos"'));
  assert.match(html, /aria-selected="true"[^>]*>Pagados/);
  assert.ok(html.includes('aria-disabled="true"'));
  assert.ok(html.includes('role="tabpanel"'));
});
