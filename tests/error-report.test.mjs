import assert from 'node:assert/strict'
import test from 'node:test'

// A tiny browser stand-in: just what errorReport.ts touches.
const listeners = {}
const posts = []
globalThis.window = {
  location: { host: 'fashion.haifa.my', pathname: '/l/dress' },
  addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn) },
  fetch: undefined,
}
const respond = { status: 200 }
globalThis.window.fetch = async (url, init) => {
  if (String(url).includes('/api/client-errors')) { posts.push(JSON.parse(init.body)); return { status: 200 } }
  if (respond.throw) throw new Error('Failed to fetch')
  return { status: respond.status }
}
globalThis.fetch = globalThis.window.fetch

const { installDemoErrorReporter } = await import('../src/lib/errorReport.ts')
installDemoErrorReporter('fashion')
installDemoErrorReporter('fashion') // second call does nothing

const fire = (type, event) => listeners[type].forEach((fn) => fn(event))
const settle = () => new Promise((r) => setTimeout(r, 5))

test('a script error is reported with the template id, the host and the page', async () => {
  fire('error', { message: 'x is not defined', filename: 'https://fashion.haifa.my/assets/index.js', target: globalThis.window })
  await settle()
  assert.equal(posts.length, 1)
  assert.equal(posts[0].source, 'template-demo:fashion')
  assert.match(posts[0].message, /^script: x is not defined/)
  assert.equal(posts[0].page, 'fashion.haifa.my/l/dress')
  assert.ok(posts[0].sessionId)
})

test('the same message is only reported once per page load', async () => {
  const before = posts.length
  fire('error', { message: 'x is not defined', filename: 'f', target: globalThis.window })
  await settle()
  assert.equal(posts.length, before)
})

test('API failures are reported (server errors, bad requests) but a guest 401 is not', async () => {
  const before = posts.length
  respond.status = 401; await globalThis.window.fetch('https://api.tradly.app/v1/cart?x=1'); await settle()
  assert.equal(posts.length, before)
  respond.status = 500; await globalThis.window.fetch('https://api.tradly.app/v1/listings?secret=abc'); await settle()
  assert.equal(posts.length, before + 1)
  assert.equal(posts.at(-1).status, 500)
  assert.equal(posts.at(-1).endpoint, 'https://api.tradly.app/v1/listings', 'the query string is not sent')
})

test('a network failure is reported and still thrown to the caller', async () => {
  respond.throw = true
  await assert.rejects(() => globalThis.window.fetch('https://api.tradly.app/v1/categories'), /Failed to fetch/)
  await settle()
  assert.match(posts.at(-1).message, /^request: Failed to fetch/)
  respond.throw = false
})

test('at most 8 different reports per page load, and reporting never reports itself', async () => {
  for (let i = 0; i < 20; i++) fire('error', { message: `unique ${i}`, filename: 'f', target: globalThis.window })
  await settle()
  assert.ok(posts.length <= 8, `sent ${posts.length}`)
})
