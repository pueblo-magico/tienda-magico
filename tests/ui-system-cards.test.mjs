import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("el ejemplo del sistema UI compone todas las tarjetas con componentes compartidos", async () => {
  const source = await readFile("src/app/ui-system/example/page.tsx", "utf8");

  assert.match(source, /InfoCard/);
  assert.match(source, /ImpactCard/);
  assert.doesNotMatch(
    source,
    /border-brand-foreground\/15 bg-brand-foreground\/10 rounded-2xl/,
  );
  assert.doesNotMatch(
    source,
    /<li[\s\S]+className="bg-card border-border rounded-2xl border p-5"/,
  );
});

test("InfoCard tiene una sección propia en el sistema UI", async () => {
  const [page, overview, navigation] = await Promise.all([
    readFile("src/app/ui-system/info-card/page.tsx", "utf8"),
    readFile("src/app/ui-system/page.tsx", "utf8"),
    readFile("src/components/ui-system/UiSystemNav.tsx", "utf8"),
  ]);

  assert.match(page, /<InfoCard/);
  assert.match(page, /tone="inverse"/);
  assert.match(page, /variant="centered"/);
  assert.match(page, /variant="prominent"/);
  assert.match(page, /variant="testimonial"/);
  assert.match(page, /tone="accent"/);
  assert.match(overview, /\/ui-system\/info-card/);
  assert.match(navigation, /\/ui-system\/info-card/);
});

test("InfoCard no combina tamaños tipográficos incompatibles", async () => {
  const component = await readFile("src/components/cards/InfoCard.tsx", "utf8");

  assert.doesNotMatch(component, /"mt-2 text-lg font-medium"/);
  assert.match(
    component,
    /variant === "prominent"[\s\S]+?\? "text-brand-foreground font-serif text-3xl"/,
  );
});

test("el testimonio mantiene contraste sobre superficies oscuras", async () => {
  const component = await readFile("src/components/cards/InfoCard.tsx", "utf8");

  assert.match(component, /const hasDarkTestimonialTone =/);
  assert.match(component, /text-brand-foreground/);
  assert.match(component, /text-brand-foreground\/70/);
});
