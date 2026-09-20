import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

export function deploymentConfig(env) {
  const value = (key, fallback) => {
    const result = env[key] || fallback;
    if (
      !result ||
      /[\r\n\0'\\]/.test(result) ||
      /CHANGE_ME|replace-me/i.test(result)
    )
      throw new Error(`Configuración inválida: ${key}`);
    return result;
  };
  const origin = (key) => {
    const raw = value(key);
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.origin !== raw)
      throw new Error(`Origen inválido: ${key}`);
    return url;
  };
  const shop = origin("SHOP_URL");
  const cms = origin("CMS_URL");
  const tag = value("IMAGE_TAG");
  if (!/^[A-Za-z0-9._-]+$/.test(tag)) throw new Error("IMAGE_TAG inválida");
  const user = value("POSTGRES_USER", "postgres");
  const database = value("POSTGRES_DB", "tienda_magico_cms");
  if (![user, database].every((name) => /^[a-zA-Z0-9_]+$/.test(name)))
    throw new Error("Nombre de base de datos o usuario inválido");
  const password = value("POSTGRES_PASSWORD");
  const revalidation = value("STOREFRONT_REVALIDATION_SECRET");
  const locale = {
    PAYLOAD_ECOMMERCE_DEFAULT_LOCALE: "es",
    PAYLOAD_ECOMMERCE_FALLBACK_LOCALE: "es",
  };
  const common = {
    NODE_ENV: "production",
    HOSTNAME: "0.0.0.0",
    ...locale,
    STOREFRONT_REVALIDATION_SECRET: revalidation,
  };
  const files = {
    "deployment.env": {
      SHOP_HOST: shop.host,
      CMS_HOST: cms.host,
      TIENDA_IMAGE_TAG: tag,
    },
    "postgres.env": {
      POSTGRES_USER: user,
      POSTGRES_DB: database,
      POSTGRES_PASSWORD: password,
    },
    "cms.env": {
      ...common,
      PORT: "4000",
      DATABASE_URL: `postgresql://${user}:${encodeURIComponent(password)}@postgres:5432/${database}`,
      PAYLOAD_SECRET: value("PAYLOAD_SECRET"),
      NEXT_PUBLIC_SERVER_URL: cms.origin,
      PAYLOAD_PUBLIC_SERVER_URL: cms.origin,
      CORS_ORIGINS: shop.origin,
      STOREFRONT_REVALIDATION_URL: `${shop.origin}/api/revalidate/catalog`,
    },
    "storefront.env": {
      ...common,
      PORT: "3000",
      NEXT_PUBLIC_SITE_URL: shop.origin,
      COMMERCE_PROVIDER: "payload",
      PAYLOAD_ECOMMERCE_URL: cms.origin,
      PAYLOAD_CMS_URL: cms.origin,
      PAYLOAD_ECOMMERCE_CURRENCY: "ARS",
      PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS: "true",
      PAYLOAD_ECOMMERCE_API_KEY_COLLECTION: "users",
      PAYLOAD_ECOMMERCE_CHECKOUT_PATH: "/checkout",
      CMS_HOME_PAGE_SLUG: "home",
      PAYLOAD_ECOMMERCE_API_KEY: env.PAYLOAD_ECOMMERCE_API_KEY
        ? value("PAYLOAD_ECOMMERCE_API_KEY")
        : "",
      PAYLOAD_CMS_API_KEY: env.PAYLOAD_CMS_API_KEY
        ? value("PAYLOAD_CMS_API_KEY")
        : "",
      CHECKOUT_PROVIDER: "mercado-pago",
      MERCADOPAGO_ACCESS_TOKEN: value("MERCADOPAGO_ACCESS_TOKEN"),
      MERCADOPAGO_WEBHOOK_SECRET: value("MERCADOPAGO_WEBHOOK_SECRET"),
      MERCADOPAGO_SANDBOX: value("MERCADOPAGO_SANDBOX"),
      MERCADOPAGO_WEBHOOK_URL: `${shop.origin}/api/checkout/webhooks/mercado-pago`,
    },
  };
  return Object.fromEntries(
    Object.entries(files).map(([name, entries]) => [
      name,
      Object.entries(entries)
        .map(([key, entry]) => `${key}='${entry}'`)
        .join("\n") + "\n",
    ]),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const files = deploymentConfig(process.env);
    const directory = process.argv[2];
    if (!directory) throw new Error("Falta el directorio de salida");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    for (const [name, contents] of Object.entries(files))
      writeFileSync(join(directory, name), contents, { mode: 0o600 });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
