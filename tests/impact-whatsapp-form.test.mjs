import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { buildWhatsAppUrl } from "@/features/impact/whatsapp";

test("construye un enlace de WhatsApp seguro con número normalizado", () => {
  assert.equal(
    buildWhatsAppUrl("+54 9 11 2345-6789", "Hola Pueblo Mágico"),
    "https://wa.me/5491123456789?text=Hola%20Pueblo%20M%C3%A1gico",
  );
});

test("sin número abre el selector de destinatario de WhatsApp", () => {
  assert.equal(buildWhatsAppUrl(undefined, "Hola"), "https://wa.me/?text=Hola");
});

test("el formulario de impacto envía sus campos mediante WhatsApp", async () => {
  const [form, page] = await Promise.all([
    readFile("src/features/impact/ImpactContactForm.tsx", "utf8"),
    readFile("src/features/impact/ImpactPage.tsx", "utf8"),
  ]);

  assert.match(form, /"use client"/);
  assert.match(form, /onSubmit=\{handleSubmit\}/);
  assert.match(form, /buildWhatsAppUrl/);
  assert.match(form, /window\.open/);
  assert.match(form, /useState\(false\)/);
  assert.match(form, /name="consent"/);
  assert.match(form, /required/);
  assert.match(form, /disabled=\{!hasConsent\}/);
  assert.match(form, /href=\{termsHref\}/);
  assert.match(form, /href=\{privacyHref\}/);
  assert.match(page, /getSiteSettings\(locale\)/);
  assert.match(page, /siteSettings\.contactPhone/);
  assert.match(page, /legalLinks\.terms/);
  assert.match(page, /legalLinks\.privacy/);
  assert.doesNotMatch(page, /WHATSAPP_CONTACT_NUMBER/);
  assert.match(page, /<ImpactContactForm/);
});

test("los enlaces legales del consentimiento comparten la configuración del pie", async () => {
  const navigation = await readFile("src/config/navigation.ts", "utf8");

  assert.match(navigation, /export const legalLinks =/);
  assert.match(navigation, /href: legalLinks\.terms/);
  assert.match(navigation, /href: legalLinks\.privacy/);
});

test("el teléfono de contacto se proyecta desde la configuración del CMS", async () => {
  const mapper = await readFile("src/lib/cms/site-settings.ts", "utf8");

  assert.match(mapper, /contactPhone: string \| null/);
  const { getSiteSettings } = await import("../src/lib/cms/site-settings.ts");
  const original = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "http://cms.test";
  globalThis.fetch = async () =>
    Response.json({ contactPhone: "  +549123456  " });
  try {
    assert.equal((await getSiteSettings("es")).contactPhone, "+549123456");
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});
