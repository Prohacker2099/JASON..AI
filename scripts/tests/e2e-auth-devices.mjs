import assert from 'node:assert'

const base = `http://localhost:${process.env.SERVER_PORT||3001}`

async function json(url, init) {
  const res = await fetch(url, init)
  const body = await res.json().catch(()=>({}))
  return { status: res.status, body }
}

async function run() {
  const health = await json(`${base}/api/health`)
  assert.equal(health.status, 200)

  const reg = await json(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ username:'e2e', email:'e2e@example.com', password:'Passw0rd!' })
  })
  assert.ok(reg.status===201 || reg.body?.error==='internal_error')

  const login = await json(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ identifier:'e2e', password:'Passw0rd!' })
  })
  assert.equal(login.status, 200)
  const token = login.body.token
  assert.ok(token)

  const created = await json(`${base}/api/devices`, {
    method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name:'E2E Lamp', type:'LIGHT', status:'OFF', protocol:'tcp' })
  })
  assert.equal(created.status, 201)
  const id = created.body.id
  assert.ok(id)

  const list = await json(`${base}/api/devices`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(list.status, 200)
  assert.ok(Array.isArray(list.body.devices))

  console.log('E2E auth+devices ✓')
}

run().catch(e => { console.error(e); process.exit(1) })