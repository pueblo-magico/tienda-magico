import assert from "node:assert/strict";
import test from "node:test";
import { customerAccountEndpoints } from "../apps/cms/src/endpoints/customerAccount.ts";

test("CMS verifica rol y sesión persistida antes de consultar pedidos", async () => {
  const session = customerAccountEndpoints.find((entry) =>
    entry.path.endsWith("/session"),
  );
  const references = customerAccountEndpoints.find((entry) =>
    entry.path.endsWith("/references"),
  );
  const identity = { id: 1, _sid: "session-one", collection: "users" };
  let user = {
    id: 1,
    name: "Ana",
    email: "ana@example.test",
    roles: ["customer"],
    sessions: [
      {
        id: "session-one",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
    ],
  };
  let reads = 0;
  const req = {
    user: identity,
    headers: new Headers(),
    payload: {
      findByID: async () => user,
      find: async (options) => {
        reads++;
        assert.deepEqual(options.where, { customer: { equals: 1 } });
        return { docs: [{ cartReference: "owned" }], hasNextPage: false };
      },
    },
  };
  assert.equal((await session.handler({ ...req, user: null })).status, 401);
  assert.equal((await session.handler(req)).status, 200);
  assert.deepEqual(await (await references.handler(req)).json(), {
    references: ["owned"],
  });
  for (const invalid of [
    { ...user, roles: ["admin"] },
    { ...user, email: "cash-staff@storefront.invalid" },
    { ...user, sessions: [] },
    { ...user, sessions: [{ id: "session-one", expiresAt: "2000-01-01" }] },
    { ...user, sessions: [{ id: "session-one", expiresAt: "invalid" }] },
    {
      ...user,
      sessions: [
        {
          id: "other-session",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      ],
    },
  ]) {
    user = invalid;
    assert.equal((await references.handler(req)).status, 401);
  }
  assert.equal(reads, 1);
});
