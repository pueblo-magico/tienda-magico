import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const reportPaths = {
  coverage: "coverage/vitest/coverage-summary.json",
  playwright: "test-results/playwright-results.json",
  vitest: ".vitest/results.json",
};

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll(/\r?\n/g, " ");
}

function statusLabel({ isMissing, hasFailures, hasFlaky = false }) {
  if (isMissing) return "⚠️ Sin reporte";
  if (hasFailures) return "❌ Con fallos";
  if (hasFlaky) return "⚠️ Inestable";
  return "✅ Aprobado";
}

function collectVitestFailures(vitest) {
  return (vitest?.testResults ?? []).flatMap((file) =>
    (file.assertionResults ?? [])
      .filter((test) => test.status === "failed")
      .map((test) => test.fullName || test.title || file.name),
  );
}

function collectPlaywrightFailures(suites, ancestors = []) {
  return (suites ?? []).flatMap((suite) => {
    const titles = suite.title ? [...ancestors, suite.title] : ancestors;
    const failures = (suite.specs ?? []).flatMap((spec) =>
      (spec.tests ?? [])
        .filter((test) => test.status === "unexpected")
        .map(() => [...titles, spec.title].filter(Boolean).join(" › ")),
    );
    return [...failures, ...collectPlaywrightFailures(suite.suites, titles)];
  });
}

function coverageRow(label, metric) {
  if (!metric) return `| ${label} | — | — |`;
  return `| ${label} | ${number(metric.pct).toFixed(2)}% | ${number(metric.covered)} / ${number(metric.total)} |`;
}

export function buildTestSummary({
  vitest,
  playwright,
  coverage,
  outcomes = {},
  runUrl,
}) {
  const vitestMissing = !vitest;
  const playwrightMissing = !playwright;
  const vitestFailed =
    outcomes.vitest === "failure" || number(vitest?.numFailedTests) > 0;
  const playwrightFailed =
    outcomes.playwright === "failure" ||
    number(playwright?.stats?.unexpected) > 0;
  const playwrightFlaky = number(playwright?.stats?.flaky) > 0;
  const isIncomplete = vitestMissing || playwrightMissing;
  const hasFailures = vitestFailed || playwrightFailed;

  const overallStatus = isIncomplete
    ? "⚠️ Incompleto"
    : hasFailures
      ? "❌ Con fallos"
      : playwrightFlaky
        ? "⚠️ Aprobado con inestabilidad"
        : "✅ Aprobado";

  const vitestSkipped =
    number(vitest?.numPendingTests) + number(vitest?.numTodoTests);
  const playwrightPassed = number(playwright?.stats?.expected);
  const playwrightSkipped = number(playwright?.stats?.skipped);
  const playwrightFailures = number(playwright?.stats?.unexpected);
  const playwrightTotal =
    playwrightPassed +
    playwrightSkipped +
    playwrightFailures +
    number(playwright?.stats?.flaky);

  const lines = [
    "# Resultados de pruebas",
    "",
    `## ${overallStatus}`,
    "",
    "| Suite | Resultado | Total | Aprobadas | Fallidas | Omitidas |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    `| Vitest | ${statusLabel({ isMissing: vitestMissing, hasFailures: vitestFailed })} | ${number(vitest?.numTotalTests)} | ${number(vitest?.numPassedTests)} | ${number(vitest?.numFailedTests)} | ${vitestSkipped} |`,
    `| Playwright | ${statusLabel({ isMissing: playwrightMissing, hasFailures: playwrightFailed, hasFlaky: playwrightFlaky })} | ${playwrightTotal} | ${playwrightPassed} | ${playwrightFailures} | ${playwrightSkipped} |`,
    "",
    "## Cobertura del conjunto migrado",
    "",
    "| Métrica | Cobertura | Cubiertas / Total |",
    "| --- | ---: | ---: |",
    coverageRow("Sentencias", coverage?.total?.statements),
    coverageRow("Ramas", coverage?.total?.branches),
    coverageRow("Funciones", coverage?.total?.functions),
    coverageRow("Líneas", coverage?.total?.lines),
  ];

  const projects = (playwright?.config?.projects ?? [])
    .map((project) => project.name)
    .filter(Boolean);
  if (projects.length > 0) {
    lines.push(
      "",
      "## Entornos E2E",
      "",
      projects.map((project) => `\`${escapeCell(project)}\``).join(", "),
    );
  }

  const missingReports = [];
  if (vitestMissing)
    missingReports.push("No se encontró el reporte JSON de Vitest.");
  if (playwrightMissing)
    missingReports.push("No se encontró el reporte JSON de Playwright.");
  if (!coverage)
    missingReports.push("No se encontró el resumen JSON de cobertura.");

  const failures = [
    ...collectVitestFailures(vitest),
    ...collectPlaywrightFailures(playwright?.suites),
  ];
  if (missingReports.length > 0 || failures.length > 0) {
    lines.push("", "## Atención", "");
    lines.push(...missingReports.map((message) => `- ${message}`));
    lines.push(
      ...failures.slice(0, 10).map((failure) => `- ❌ ${escapeCell(failure)}`),
    );
    if (failures.length > 10)
      lines.push(`- …y ${failures.length - 10} fallas más.`);
  }

  lines.push(
    "",
    "> La cobertura refleja los módulos incorporados a la suite migrada; todavía no representa todo `src`.",
    "",
    "Los reportes HTML detallados están disponibles en los artefactos de esta ejecución.",
  );
  if (runUrl) lines.push("", `[Abrir la ejecución completa](${runUrl})`);

  return `${lines.join("\n")}\n`;
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT")
      console.warn(`No se pudo leer ${path}: ${error.message}`);
    return null;
  }
}

async function main() {
  const [vitest, playwright, coverage] = await Promise.all([
    readJson(reportPaths.vitest),
    readJson(reportPaths.playwright),
    readJson(reportPaths.coverage),
  ]);
  const runUrl =
    process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;
  const summary = buildTestSummary({
    vitest,
    playwright,
    coverage,
    outcomes: {
      vitest: process.env.VITEST_OUTCOME,
      playwright: process.env.PLAYWRIGHT_OUTCOME,
    },
    runUrl,
  });

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, "utf8");
  } else {
    process.stdout.write(summary);
  }
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) await main();
