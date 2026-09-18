import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../src/components/ui/Button.tsx";

test("el botón permite conservar mayúsculas y minúsculas sin clases contradictorias", () => {
  const html = renderToStaticMarkup(
    createElement(Button, { textCase: "sentence" }, "Pagar"),
  );
  assert.doesNotMatch(html, /uppercase/);
  assert.match(html, /normal-case/);
});

test("el botón conserva las mayúsculas predeterminadas", () => {
  assert.match(
    renderToStaticMarkup(createElement(Button, null, "Pagar")),
    /uppercase/,
  );
});
