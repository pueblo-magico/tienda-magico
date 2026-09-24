import assert from "node:assert/strict";
import test from "node:test";
import { getSiteSettings } from "../src/lib/cms/site-settings.ts";
import { composeSeoMetadata } from "../src/lib/cms/seo.ts";
import { getHeaderLogo } from "../src/lib/cms/site-settings.ts";
import { settingsImage } from "../src/lib/cms/settings-values.ts";

test("logos respetan prioridad, locale, no-store y respaldos seguros", async () => {
  const original = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "http://cms:4000";
  process.env.CMS_MEDIA_ORIGIN = "https://cms.example.test";
  let header = { logo: { url: "/header.svg" } };
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).searchParams.get("locale"), "en");
    assert.equal(options.cache, "no-store");
    return Response.json(
      new URL(url).pathname.endsWith("header")
        ? header
        : { logo: { url: "/site.svg" } },
    );
  };
  try {
    const settings = await getSiteSettings("en");
    assert.equal(
      (await getHeaderLogo("en", settings)).url,
      "https://cms.example.test/header.svg",
    );
    header = { logo: { url: "javascript:alert(1)" } };
    assert.equal(
      (await getHeaderLogo("en", settings)).url,
      "https://cms.example.test/site.svg",
    );
    assert.equal(settingsImage("//evil.test/image"), null);
    assert.equal(settingsImage("https://user:secret@example.test/image"), null);
    globalThis.fetch = async () => Response.json({});
    const empty = await getSiteSettings("en");
    assert.equal(empty.siteName, "Pueblo Mágico");
    assert.equal(await getHeaderLogo("en", empty), null);
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    assert.equal((await getSiteSettings("en")).logo, null);
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});

test("SEO conserva prioridades y convierte imágenes internas a URLs públicas", () => {
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "http://cms:4000";
  process.env.CMS_MEDIA_ORIGIN = "https://cms.example.test";
  try {
    const metadata = composeSeoMetadata(
      { siteName: "Marca" },
      {
        defaultTitle: "Inicio",
        defaultDescription: "Descripción global",
        titleTemplate: "%s | Marca",
        robots: { index: false },
        twitterHandle: "@marca",
      },
      "Respaldo",
      {
        title: "Producto",
        image: "http://cms:4000/api/media/file/product.jpg",
      },
    );
    assert.equal(metadata.title, "Producto");
    assert.equal(metadata.description, "Descripción global");
    assert.equal(metadata.robots.index, false);
    assert.equal(
      metadata.openGraph.images[0].url,
      "https://cms.example.test/api/media/file/product.jpg",
    );
    assert.equal(metadata.twitter.site, "@marca");
    const privatePage = composeSeoMetadata(
      { siteName: "Marca" },
      {},
      "Respaldo",
      { noIndex: true },
    );
    assert.deepEqual(privatePage.robots, { index: false, follow: false });
    assert.equal(privatePage.description, "Respaldo");
  } finally {
    process.env = environment;
  }
});

test("configuración proyecta identidad, contacto y redes seguras del CMS", async () => {
  const original = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "http://cms:4000";
  process.env.CMS_MEDIA_ORIGIN = "https://cms.example.test";
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).searchParams.get("locale"), "es");
    return Response.json({
      siteName: "Marca editorial",
      tagline: "Hecho en comunidad",
      logo: { url: "http://cms:4000/api/media/file/logo.svg", alt: "Marca" },
      contactEmail: "hola@example.test",
      contactPhone: "12345",
      social: [
        {
          platform: "instagram",
          url: "https://instagram.com/example",
          label: "Instagram",
        },
        { url: "javascript:alert(1)" },
      ],
    });
  };
  try {
    const settings = await getSiteSettings("es");
    assert.equal(settings.siteName, "Marca editorial");
    assert.equal(settings.tagline, "Hecho en comunidad");
    assert.equal(
      settings.logo.url,
      "https://cms.example.test/api/media/file/logo.svg",
    );
    assert.equal(settings.contactEmail, "hola@example.test");
    assert.equal(settings.social.length, 1);
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});
