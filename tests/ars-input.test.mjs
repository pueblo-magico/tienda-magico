import assert from "node:assert/strict";
import test, { describe } from "node:test";
import * as storefront from "../src/lib/money/ars-input.ts";
import * as cms from "../apps/cms/src/utilities/arsInput.ts";

for (const [name, implementation] of Object.entries({ storefront, cms })) {
  describe(name, () => {
    const { arsPesosToMinorUnits, formatArsPesos, formatArsEdit } =
      implementation;

    test("convierte pesos enteros a centavos una sola vez", () => {
      assert.equal(arsPesosToMinorUnits("20000"), 2000000);
      assert.equal(arsPesosToMinorUnits("20.000"), 2000000);
      assert.equal(arsPesosToMinorUnits("1.000"), 100000);
      assert.equal(arsPesosToMinorUnits("1"), 100);
    });

    test("no interpreta decimales, importes negativos ni entradas ambiguas como pagos", () => {
      for (const value of [
        "",
        " ",
        "0",
        "-20000",
        "20,50",
        "20.50",
        "20,000",
        "1e3",
        "$ 20.000",
        "NaN",
        null,
        20000,
      ]) {
        assert.equal(arsPesosToMinorUnits(value), null, String(value));
      }
    });

    test("rechaza importes que pierden precisión al convertirlos", () => {
      assert.equal(arsPesosToMinorUnits("90071992547410"), null);
      assert.equal(arsPesosToMinorUnits("90071992547409"), 9007199254740900);
    });

    test("agrupa pesos en miles sin decimales y permite borrar el campo", () => {
      for (const [value, expected] of [
        ["", ""],
        ["2", "2"],
        ["200", "200"],
        ["2000", "2.000"],
        ["20000", "20.000"],
        ["2000000", "2.000.000"],
        ["20.000", "20.000"],
        ["00020", "20"],
      ]) {
        assert.equal(formatArsPesos(value), expected);
      }
    });

    test("no oculta caracteres inválidos convirtiéndolos en otro importe", () => {
      for (const value of ["-20", "20,50", "1e3", "20.50", "$ 20.000"]) {
        assert.equal(formatArsPesos(value), value);
      }
    });

    test("mantiene el cursor al insertar y borrar dentro del importe", () => {
      assert.deepEqual(formatArsEdit("20.5000", 4, "insertText", "20.000"), {
        text: "205.000",
        selection: 3,
      });
      assert.deepEqual(
        formatArsEdit("20.00", 5, "deleteContentBackward", "20.000"),
        { text: "2.000", selection: 5 },
      );
      assert.deepEqual(formatArsEdit("", 0, "deleteContentBackward", "2"), {
        text: "",
        selection: 0,
      });
    });

    test("pegar o escribir decimales no los transforma en pesos de otro valor", () => {
      assert.equal(formatArsEdit("20.50", 5, "insertFromPaste").text, "20.50");
      assert.equal(formatArsEdit("20.", 3, "insertText", "20").text, "20.");
      assert.equal(formatArsEdit("20.5", 4, "insertText", "20.").text, "20.5");
      assert.equal(
        formatArsEdit("20.50", 5, "insertText", "20.5").text,
        "20.50",
      );
    });
  });
}
