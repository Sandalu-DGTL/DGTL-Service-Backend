import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RolesGuard } from '../dist/auth/roles.guard.js'

for (const [role, status, allowed] of [
  ['admin', 'active', true],
  ['admin', 'suspended', false],
  ['admin', 'invited', false],
  ['client', 'active', false],
]) {
  test(`${status} ${role} admin access: ${allowed}`, () => {
    const guard = new RolesGuard({ getAllAndOverride: () => ['admin'] })
    const context = {
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user: { role, status } }) }),
    }
    assert.equal(guard.canActivate(context), allowed)
  })
}
