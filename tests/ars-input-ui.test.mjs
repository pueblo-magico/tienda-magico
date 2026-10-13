import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Input } from "@pueblo-magico/react-ui";
import { ArsInput } from "../src/components/ui/ArsInput.tsx";

test("el input ARS muestra pesos agrupados y usa teclado numérico sin type number", () => {
  const html = renderToStaticMarkup(
    createElement(ArsInput, {
      name: "amount",
      defaultValue: "20000",
      label: "Importe",
      isRequired: true,
    }),
  );
  assert.match(html, /value="20\.000"/);
  assert.match(html, /type="text"/);
  assert.match(html, /inputMode="numeric"/);
  assert.match(html, /required=""/);
});

test("el formato conserva los estados accesibles de error y deshabilitado", () => {
  const html = renderToStaticMarkup(
    createElement(ArsInput, {
      name: "amount",
      value: "20,50",
      label: "Importe",
      errorMessage: "Ingresá pesos enteros",
      isInvalid: true,
      isDisabled: true,
    }),
  );
  assert.match(html, /value="20,50"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /disabled=""/);
});

test("los demás inputs mantienen su tipo y valor sin formato monetario", () => {
  const html = renderToStaticMarkup(
    createElement(Input, {
      name: "quantity",
      label: "Cantidad",
      type: "number",
      defaultValue: 20000,
    }),
  );
  assert.match(html, /type="number"/);
  assert.match(html, /value="20000"/);
  assert.doesNotMatch(html, /value="20\.000"/);
});
