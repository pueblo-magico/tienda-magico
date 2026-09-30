// @vitest-environment node

import { describe, expect, test } from "vitest";
import { buildTestSummary } from "../../../scripts/ci-test-summary.mjs";

const successfulResults = {
  vitest: {
    numTotalTestSuites: 5,
    numPassedTestSuites: 5,
    numFailedTestSuites: 0,
    numTotalTests: 45,
    numPassedTests: 45,
    numFailedTests: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    success: true,
    testResults: [],
  },
  playwright: {
    config: {
      projects: [{ name: "chromium-desktop" }, { name: "chromium-mobile" }],
    },
    suites: [],
    stats: {
      duration: 11_400,
      expected: 2,
      unexpected: 0,
      flaky: 0,
      skipped: 0,
    },
  },
  coverage: {
    total: {
      statements: { total: 94, covered: 81, pct: 86.17 },
      branches: { total: 130, covered: 122, pct: 93.84 },
      functions: { total: 23, covered: 20, pct: 86.95 },
      lines: { total: 88, covered: 75, pct: 85.22 },
    },
  },
  outcomes: { vitest: "success", playwright: "success" },
  runUrl: "https://github.com/example/repo/actions/runs/123",
};

describe("buildTestSummary", () => {
  test("resume suites, cobertura, entornos y vínculo de ejecución", () => {
    const summary = buildTestSummary(successfulResults);

    expect(summary).toContain("# Resultados de pruebas");
    expect(summary).toContain("✅ Aprobado");
    expect(summary).toContain("| Vitest | ✅ Aprobado | 45 | 45 | 0 | 0 |");
    expect(summary).toContain("| Playwright | ✅ Aprobado | 2 | 2 | 0 | 0 |");
    expect(summary).toContain("| Sentencias | 86.17% | 81 / 94 |");
    expect(summary).toContain("`chromium-desktop`, `chromium-mobile`");
    expect(summary).toContain(successfulResults.runUrl);
  });

  test("expone pruebas fallidas en lugar de ocultarlas", () => {
    const summary = buildTestSummary({
      ...successfulResults,
      vitest: {
        ...successfulResults.vitest,
        numPassedTests: 44,
        numFailedTests: 1,
        success: false,
        testResults: [
          {
            assertionResults: [
              {
                fullName: "checkout rechaza una orden inválida",
                status: "failed",
              },
            ],
          },
        ],
      },
      outcomes: { vitest: "failure", playwright: "success" },
    });

    expect(summary).toContain("❌ Con fallos");
    expect(summary).toContain("checkout rechaza una orden inválida");
  });

  test("marca un resultado incompleto cuando falta un reporte", () => {
    const summary = buildTestSummary({
      ...successfulResults,
      playwright: null,
      outcomes: { vitest: "success", playwright: "failure" },
    });

    expect(summary).toContain("⚠️ Incompleto");
    expect(summary).toContain("No se encontró el reporte JSON de Playwright");
  });
});
