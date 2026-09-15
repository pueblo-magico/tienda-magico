import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

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
