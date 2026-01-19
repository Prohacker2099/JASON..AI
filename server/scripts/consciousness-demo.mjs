import fetch from 'node-fetch'

const base = process.env.BASE_URL || 'http://127.0.0.1:3001'

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, json }
}

async function get(path) {
  const res = await fetch(base + path)
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, json }
}

async function main() {
  try {
    console.log('Starting consciousness (simulate=true, interval=1000ms)...')
    const start = await post('/api/ai/conscious/start', { goal: 'Be helpful via text-only actions', simulate: true, intervalMs: 1000 })
    console.log('start', start.json)

    console.log('Observing a text cue...')
    const obs = await post('/api/ai/conscious/observe', { text: 'User says: hello world, how are you?', tags: ['greeting','demo'] })
    console.log('observe', obs.json)

    // Give it a couple of ticks
    await new Promise(r => setTimeout(r, 2500))

    const status = await get('/api/ai/conscious/status')
    console.log('status', status.json)

    const logs = await get('/api/ai/conscious/logs?limit=5')
    console.log('logs', logs.json)
  } catch (e) {
    console.error('consciousness demo failed', e)
    process.exit(1)
  }
}

main()
