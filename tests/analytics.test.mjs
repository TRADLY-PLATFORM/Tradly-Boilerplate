import assert from 'node:assert/strict'
import test from 'node:test'
import { tenantIdFromKey } from '../src/lib/analytics.ts'

const token = (claims) => `h.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.s`

test('the tenant id is read from the store key', () => {
  assert.equal(tenantIdFromKey(token({ tenant_id: 1449, user_id: 7 })), '1449')
  assert.equal(tenantIdFromKey(token({ tenantId: '566' })), '566')
})

test('a key without a tenant id, or not a token at all, gives no project (no tracker is loaded)', () => {
  assert.equal(tenantIdFromKey(token({ user_id: 7 })), '')
  assert.equal(tenantIdFromKey(''), '')
  assert.equal(tenantIdFromKey('pk_live_abc'), '')
  assert.equal(tenantIdFromKey('a.%%%.c'), '')
})
