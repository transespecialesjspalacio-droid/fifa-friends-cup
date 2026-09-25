import { test } from "node:test";
import assert from "node:assert/strict";

import { RESULT_SAVED_DESTINATION } from "@/lib/navigation";

test("Un guardado exitoso termina en la navegación a '/'", () => {
  assert.equal(RESULT_SAVED_DESTINATION, "/");
});

test("El destino de guardado apunta al Dashboard público y no a /admin/resultados", () => {
  assert.equal(RESULT_SAVED_DESTINATION.startsWith("/"), true);
  assert.notEqual(RESULT_SAVED_DESTINATION, "/admin/resultados");
});