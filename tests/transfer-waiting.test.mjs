import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createTranslator } from "next-intl";
import { getTransferWaitingState } from "../src/lib/checkout/transfer-waiting.ts";
import { startTransferPolling } from "../src/features/checkout/transfer-polling.ts";

const deadline = "2026-09-15T12:15:00.000Z";
const now = Date.parse("2026-09-15T12:00:00.000Z");

test("consulta cada diez segundos, respeta visibilidad y limpia recursos", (context) => {
  context.mock.timers.enable({ apis: ["setInterval"] });
  const visibility = new EventTarget();
  visibility.visibilityState = "visible";
  let calls = 0;
  let busy = false;
  const stop = startTransferPolling({
    visibility,
    isRefreshing: () => busy,
    refresh: () => {
      calls++;
    },
  });
  context.mock.timers.tick(9999);
  assert.equal(calls, 0);
  context.mock.timers.tick(1);
  assert.equal(calls, 1);
  busy = true;
  context.mock.timers.tick(10000);
  visibility.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 1);
  busy = false;
  visibility.visibilityState = "hidden";
  context.mock.timers.tick(30000);
  assert.equal(calls, 1);
  visibility.visibilityState = "visible";
  visibility.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 2);
  stop();
  context.mock.timers.tick(30000);
  visibility.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 2);
});

test("un estado desconocido o reloj inválido no habilita el pago", () => {
  for (const status of [undefined, null, "paid", "", "expired"]) {
    assert.deepEqual(getTransferWaitingState(status, deadline, now), {
      status: "unverified",
      remainingSeconds: 0,
      canPay: false,
    });
  }
  for (const invalidNow of [NaN, Infinity, -Infinity]) {
    assert.equal(
      getTransferWaitingState("pending", deadline, invalidNow).status,
      "unverified",
    );
  }
});

test("el último segundo sigue disponible hasta el límite exacto", () => {
  assert.deepEqual(
    getTransferWaitingState("pending", deadline, Date.parse(deadline) - 1),
    {
      status: "pending",
      remainingSeconds: 1,
      canPay: true,
    },
  );
});

test("los estados finales permanecen finales antes y después del vencimiento", () => {
  for (const status of ["approved", "rejected", "cancelled", "unverified"]) {
    for (const instant of [
      now,
      Date.parse(deadline),
      Date.parse(deadline) + 1,
    ]) {
      assert.deepEqual(getTransferWaitingState(status, deadline, instant), {
        status,
        remainingSeconds: 0,
        canPay: false,
      });
    }
  }
});

test("todos los estados y mensajes se resuelven en ambos idiomas", async () => {
  for (const locale of ["es", "en"]) {
    const messages = JSON.parse(
      await readFile(`messages/${locale}.json`, "utf8"),
    );
    const t = createTranslator({
      locale,
      messages,
      namespace: "checkout.transferWaiting",
      onError: (error) => {
        throw error;
      },
    });
    for (const status of [
      "pending",
      "approved",
      "expired",
      "rejected",
      "cancelled",
      "unverified",
    ]) {
      assert.ok(
        t.rich(`${status}.title`, { highlight: (chunks) => chunks }).length,
      );
      assert.ok(t(`${status}.body`).length);
    }
    assert.match(t("remaining", { minutes: 14, seconds: 59 }), /14.*59/);
    assert.match(t("reference", { reference: "uuid-prueba" }), /uuid-prueba/);
    assert.ok(t("check").length);
    assert.ok(t("checking").length);
  }
});

test("el plazo restante se calcula desde el vencimiento persistido", () => {
  assert.deepEqual(getTransferWaitingState("pending", deadline, now), {
    status: "pending",
    remainingSeconds: 900,
    canPay: true,
  });
});

test("el límite exacto vence sin segundos negativos", () => {
  for (const elapsed of [900_000, 901_000]) {
    assert.deepEqual(
      getTransferWaitingState("pending", deadline, now + elapsed),
      {
        status: "expired",
        remainingSeconds: 0,
        canPay: false,
      },
    );
  }
});

test("un pago aprobado prevalece sobre el vencimiento", () => {
  assert.equal(
    getTransferWaitingState("approved", deadline, now + 901_000).status,
    "approved",
  );
});

test("no ofrece transferir con un estado final o plazo inválido", () => {
  for (const status of ["rejected", "cancelled", "unverified"]) {
    assert.equal(getTransferWaitingState(status, deadline, now).canPay, false);
  }
  for (const invalid of [null, "", "invalid"]) {
    assert.equal(
      getTransferWaitingState("pending", invalid, now).status,
      "unverified",
    );
  }
});
