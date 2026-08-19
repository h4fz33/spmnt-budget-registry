import assert from "node:assert/strict"

import {
  ACTIVE_DIRECTOR_ONLY_COMMANDS,
  AUTHORIZATION_ROLES,
  P0_04_AUTHORIZATION_MATRIX,
  SUBSTITUTE_DIRECTOR_COMMANDS,
} from "../src/lib/authorization/matrix.ts"

const expectedCommands = [
  "AUTH-01",
  "AUTH-01/BOOTSTRAP",
  ...Array.from({ length: 38 }, (_, index) => `AUTH-${String(index + 2).padStart(2, "0")}`),
].sort()

assert.deepEqual(Object.keys(P0_04_AUTHORIZATION_MATRIX).sort(), expectedCommands)
assert.deepEqual(SUBSTITUTE_DIRECTOR_COMMANDS, ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"])
assert.ok(ACTIVE_DIRECTOR_ONLY_COMMANDS.includes("AUTH-21"))

const coveredRoles = new Set(
  Object.values(P0_04_AUTHORIZATION_MATRIX).flatMap((entry) => entry.actors),
)
for (const role of AUTHORIZATION_ROLES) {
  assert.ok(coveredRoles.has(role), `P0-04 role is missing from the authorization matrix: ${role}`)
}

assert.deepEqual(P0_04_AUTHORIZATION_MATRIX["AUTH-21"].actors, ["SCHOOL_DIRECTOR"])
assert.equal(P0_04_AUTHORIZATION_MATRIX["AUTH-29"].implementation, "DENIED")
assert.equal(P0_04_AUTHORIZATION_MATRIX["AUTH-30"].implementation, "DENIED")

console.info("P1-06 authorization matrix verification passed.")
