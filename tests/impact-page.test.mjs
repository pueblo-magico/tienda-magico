import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("la página de impacto reutiliza la composición del sistema UI", async () => {
  const [route, page, contactForm, messagesEs, messagesEn] = await Promise.all([
    readFile("src/app/[locale]/impact/page.tsx", "utf8"),
    readFile("src/features/impact/ImpactPage.tsx", "utf8"),
    readFile("src/features/impact/ImpactContactForm.tsx", "utf8"),
    readFile("messages/es.json", "utf8"),
    readFile("messages/en.json", "utf8"),
  ]);

  assert.match(route, /<ImpactPage/);
  assert.match(route, /generateMetadata/);
  assert.match(page, /<InfoCard/);
  assert.match(page, /<ImpactCard/);
  assert.match(page, /<ImpactContactForm/);
  assert.match(contactForm, /<Input/);
  assert.match(contactForm, /<Select/);
  assert.match(contactForm, /<Textarea/);
  assert.match(page, /getLocale/);
  assert.match(
    page,
    /principles: locale === "es" \? "principios" : "principles"/,
  );
  assert.match(page, /results: locale === "es" \? "resultados" : "results"/);
  assert.match(page, /contact: locale === "es" \? "contacto" : "contact"/);
  assert.match(page, /href=\{`#\$\{anchors\.principles\}`\}/);
  assert.match(page, /id=\{anchors\.principles\}/);
  assert.doesNotMatch(page, /DocsPageHeader|DocsSection/);
  assert.match(messagesEs, /"impactPage"/);
  assert.match(messagesEn, /"impactPage"/);
  assert.match(messagesEs, /"title": "Nuestro impacto"/);
  assert.match(messagesEn, /"title": "Our impact"/);
  assert.match(messagesEs, /"impact": "Impacto"/);
  assert.match(messagesEn, /"impact": "Impact"/);
  assert.match(messagesEs, /"consentPrefix"/);
  assert.match(messagesEn, /"consentPrefix"/);
});
