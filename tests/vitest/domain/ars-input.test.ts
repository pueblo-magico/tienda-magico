// @vitest-environment jsdom

import { describe, expect, test } from "vitest";
import {
  arsPesosToMinorUnits,
  formatArsEdit,
  formatArsInputElement,
  formatArsPesos,
} from "@/lib/money/ars-input";

describe("conversión de pesos argentinos", () => {
  test.each([
    ["1", 100],
    ["1.234", 123_400],
    ["0005", 500],
  ])("convierte %s a unidades menores", (value, expected) => {
    expect(arsPesosToMinorUnits(value)).toBe(expected);
  });

  test.each([undefined, 100, "", "1,50", "-1", "0"])(
    "rechaza un importe inválido: %j",
    (value) => {
      expect(arsPesosToMinorUnits(value)).toBeNull();
    },
  );

  test.each([
    ["1234", "1.234"],
    ["001234", "1.234"],
    ["1.234", "1.234"],
    ["12,34", "12,34"],
  ])("formatea %s como %s", (value, expected) => {
    expect(formatArsPesos(value)).toBe(expected);
  });
});

describe("edición de importes", () => {
  test("agrupa dígitos y conserva la posición lógica del cursor", () => {
    expect(formatArsEdit("1234", 4, "insertText", "123")).toEqual({
      text: "1.234",
      selection: 5,
    });
  });

  test("no reagrupa cuando la persona inserta un separador", () => {
    expect(formatArsEdit("1.234", 2, "insertText", "1234")).toEqual({
      text: "1.234",
      selection: 2,
    });
  });

  test("aplica el formato y actualiza el cursor del elemento", () => {
    const input = document.createElement("input");
    input.value = "1234";
    input.setSelectionRange(4, 4);

    formatArsInputElement(input, "insertText", "123");

    expect(input.value).toBe("1.234");
    expect(input.selectionStart).toBe(5);
  });
});
