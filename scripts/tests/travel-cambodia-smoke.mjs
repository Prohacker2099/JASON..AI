const BASE = process.env.SERVER || 'http://localhost:3001'
const TIMEOUT_MS = Number(process.env.TIMEOUT || 600000)

async function json(path, init) {
  const res = await fetch(BASE + path, init)
  const txt = await res.text()
  let body = null
  try { body = txt ? JSON.parse(txt) : null } catch { body = txt }
  return { ok: res.ok, status: res.status, body }
}

async function waitForHealth() {
  const start = Date.now()
  while (Date.now() - start < TIMEOUT_MS) {
    try {
      const res = await fetch(BASE + '/api/health')
      if (res.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('health_check_timeout')
}

async function registerAndLogin() {
  const username = `cambodia_tester_${Date.now()}`
  const email = `${username}@example.com`
  const password = 'Test1234!cambodia'

  const reg = await json('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  if (!reg.ok) throw new Error(`register_failed status=${reg.status} body=${JSON.stringify(reg.body)}`)

  const login = await json('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: username, password }),
  })
  if (!login.ok || !login.body?.token) throw new Error(`login_failed status=${login.status} body=${JSON.stringify(login.body)}`)

  return String(login.body.token)
}

async function startCambodiaPlan(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
  const body = {
    origin: 'LHR',
    departureDate: '',
    passengers: 5,
    cabin: 'ECONOMY',
  }
  const res = await json('/api/ai/travel/cambodia-15d', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body?.jobId) throw new Error(`travel_cambodia_15d_failed status=${res.status} body=${JSON.stringify(res.body)}`)
  return {
    jobId: String(res.body.jobId),
    goal: String(res.body.goal || ''),
    planId: String(res.body.planId || ''),
  }
}

async function waitForJob(jobId) {
  const start = Date.now()
  let lastStatus = null
  let seenTravelPlan = false

  while (Date.now() - start < TIMEOUT_MS) {
    const res = await json('/api/orch/jobs', { method: 'GET' })
    if (!res.ok) throw new Error(`orch_jobs_failed status=${res.status} body=${JSON.stringify(res.body)}`)

    const list = Array.isArray(res.body) ? res.body : []
    const job = list.find((j) => j && typeof j.id === 'string' && j.id === jobId)
    if (job) {
      lastStatus = job.status || null
      if (job.travelPlan && job.travelPlan.scenario === 'cambodia_15d_luxury_budget') {
        seenTravelPlan = true
      }
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return { status: job.status, seenTravelPlan }
      }
    }

    await new Promise((r) => setTimeout(r, 2000))
  }

  return { status: lastStatus || 'timeout', seenTravelPlan }
}

async function main() {
  await waitForHealth()
  const token = await registerAndLogin()
  const start = await startCambodiaPlan(token)
  const result = await waitForJob(start.jobId)
  const output = {
    server: BASE,
    jobId: start.jobId,
    planId: start.planId,
    goal: start.goal,
    status: result.status,
    seenTravelPlan: result.seenTravelPlan,
  }
  console.log(JSON.stringify(output, null, 2))
  if (result.status !== 'completed' || !result.seenTravelPlan) {
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error('travel-cambodia-smoke failed', e)
  process.exit(1)
})
