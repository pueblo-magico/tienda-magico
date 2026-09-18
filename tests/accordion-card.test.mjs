import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Accordion } from "../src/components/ui/Accordion.tsx";

test("las secciones de tarjeta admiten iconos y contenido abierto inicialmente", () => {
  const html = renderToStaticMarkup(
    createElement(Accordion, {
      variant: "card",
      defaultOpenItems: ["datos"],
      items: [
        {
          id: "datos",
          title: "Tus datos",
          icon: createElement("span", null, "icono"),
          content: "Contenido",
        },
      ],
    }),
  );
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /icono/);
  assert.match(html, /bg-card/);
  assert.doesNotMatch(html, /hidden=""/);
});

test("el acordeón existente permanece cerrado inicialmente", () => {
  const html = renderToStaticMarkup(
    createElement(Accordion, {
      items: [{ id: "datos", title: "Tus datos", content: "Contenido" }],
    }),
  );
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /hidden=""/);
});
