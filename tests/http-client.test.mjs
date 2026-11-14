import test from "node:test";
import assert from "node:assert/strict";
import { requestApi } from "../lib/http-client.ts";

test("el cliente conserva la sesión de mismo origen y devuelve JSON", async (t) => {
  t.mock.method(globalThis, "fetch", async (path, options) => {
    assert.equal(path, "/api/health");
    assert.equal(options.credentials, "same-origin");
    return Response.json({ configured: true });
  });
  assert.deepEqual(await requestApi("health"), { configured: true });
});

test("HTML 504 del proxy se convierte en error legible y no reenvía la escritura", async (t) => {
  let count = 0;
  t.mock.method(globalThis, "fetch", async () => {
    count++;
    return new Response("<html>Gateway timeout</html>", { status: 504 });
  });
  await assert.rejects(requestApi("reports", { method: "POST", body: "{}" }), (error) => {
    assert.equal(error.status, 504);
    assert.match(error.message, /servidor se está iniciando/);
    assert.doesNotMatch(error.message, /html|Unexpected token/);
    return true;
  });
  assert.equal(count, 1);
});

test("errores de autorización mantienen código HTTP y mensaje API", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Sesión expirada" }, { status: 401 }));
  await assert.rejects(requestApi("reports"), (error) => error.status === 401 && error.message === "Sesión expirada");
});
