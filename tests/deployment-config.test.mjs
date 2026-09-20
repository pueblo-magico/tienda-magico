import test from "node:test";
import assert from "node:assert/strict";
import { deploymentConfig } from "../deploy/manual/deployment-config.mjs";

const settings = {
  SHOP_URL: "https://shop.test",
  CMS_URL: "https://cms.test",
  IMAGE_TAG: "production-test",
  POSTGRES_PASSWORD: "test-password-$#",
  PAYLOAD_SECRET: "test-payload",
  STOREFRONT_REVALIDATION_SECRET: "test-revalidation",
  MERCADOPAGO_ACCESS_TOKEN: "test-token",
  MERCADOPAGO_WEBHOOK_SECRET: "test-webhook",
  MERCADOPAGO_SANDBOX: "false",
};
test("genera todos los archivos sin depender de la VM", () => {
  const files = deploymentConfig(settings);
  assert.deepEqual(Object.keys(files).sort(), [
    "cms.env",
    "deployment.env",
    "postgres.env",
    "storefront.env",
  ]);
  assert.ok(files["cms.env"].includes("test-password-%24%23@postgres:5432"));
  assert.ok(files["storefront.env"].includes("test-revalidation"));
  assert.ok(files["deployment.env"].includes("SHOP_HOST='shop.test'"));
  assert.ok(
    files["postgres.env"].includes("POSTGRES_PASSWORD='test-password-$#'"),
  );
});
test("rechaza configuración incompleta e inyección sin exponer secretos", () => {
  assert.throws(
    () => deploymentConfig({ ...settings, PAYLOAD_SECRET: "" }),
    /PAYLOAD_SECRET/,
  );
  assert.throws(
    () =>
      deploymentConfig({ ...settings, POSTGRES_PASSWORD: "private\nINJECT=x" }),
    (error) => !error.message.includes("private"),
  );
});
