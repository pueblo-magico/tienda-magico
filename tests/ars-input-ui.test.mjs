import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Input } from "../src/components/ui/Input.tsx";

test("el input ARS muestra pesos agrupados y usa teclado numérico sin type number", () => {
  const html = renderToStaticMarkup(
    createElement(Input, {
      name: "amount",
      format: "ars-pesos",
      defaultValue: "20000",
      label: "Importe",
      required: true,
    }),
  );
  assert.match(html, /value="20\.000"/);
  assert.match(html, /type="text"/);
  assert.match(html, /inputMode="numeric"/);
  assert.match(html, /required=""/);
});

test("el formato conserva los estados accesibles de error y deshabilitado", () => {
  const html = renderToStaticMarkup(
    createElement(Input, {
      name: "amount",
      format: "ars-pesos",
      value: "20,50",
      error: "Ingresá pesos enteros",
      disabled: true,
    }),
  );
  assert.match(html, /value="20,50"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="amount-error"/);
  assert.match(html, /disabled=""/);
});

test("los demás inputs mantienen su tipo y valor sin formato monetario", () => {
  const html = renderToStaticMarkup(
    createElement(Input, {
      name: "quantity",
      type: "number",
      defaultValue: 20000,
    }),
  );
  assert.match(html, /type="number"/);
  assert.match(html, /value="20000"/);
  assert.doesNotMatch(html, /value="20\.000"/);
});
