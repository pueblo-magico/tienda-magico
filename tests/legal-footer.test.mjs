import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("desactiva enlaces automáticos de iOS sin ocultar errores de hidratación del pie legal", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8");
  const footer = await readFile(
    "src/components/layout/LegalFooter.tsx",
    "utf8",
  );
  const detection = layout.match(/formatDetection:\s*\{([^}]+)\}/)?.[1] ?? "";
  for (const kind of ["telephone", "address", "email"]) {
    assert.match(detection, new RegExp(`${kind}:\\s*false`));
  }
  assert.doesNotMatch(footer, /suppressHydrationWarning/);
  assert.match(footer, /legalLinks\.terms/);
  assert.match(footer, /legalLinks\.privacy/);
});

test("el pie legal reutiliza enlaces existentes y muestra el QR de ARCA", async () => {
  const [legalFooter, footer, navigation, nextConfig] = await Promise.all([
    readFile("src/components/layout/LegalFooter.tsx", "utf8"),
    readFile("src/components/layout/Footer.tsx", "utf8"),
    readFile("src/config/navigation.ts", "utf8"),
    readFile("next.config.ts", "utf8"),
  ]);

  assert.match(footer, /<LegalFooter/);
  assert.match(legalFooter, /legalLinks\.terms/);
  assert.match(legalFooter, /legalLinks\.privacy/);
  assert.match(
    legalFooter,
    /https:\/\/experienciamagico\.com\/uploads\/qr-arca\.png/,
  );
  assert.match(legalFooter, /<Image/);
  assert.match(nextConfig, /hostname: "experienciamagico\.com"/);
  assert.doesNotMatch(
    navigation,
    /href: legalLinks\.terms,[\s\S]+labelKey: "nav\.terms"/,
  );
  assert.doesNotMatch(footer, /© \{new Date\(\)\.getFullYear\(\)\}/);
});
