const BASE = process.env.SERVER || 'http://localhost:3001'
const DURATION_SEC = Number(process.env.DURATION || 8)

async function json(path, init) {
  const res = await fetch(BASE + path, init)
  if (!res.ok) throw new Error(`${path} => ${res.status}`)
  return res.json()
}

async function metrics() {
  const res = await fetch(BASE + '/api/dev/sys-metrics')
  return res.ok ? res.json() : { heapMB: NaN, rssMB: NaN, cpu: {}, pid: process.pid }
}

async function main() {
  const policy = { maxRps: Number(process.env.MAX_RPS || 1), maxConcurrent: Number(process.env.MAX_CONC || 1), maxHeapMB: Number(process.env.MAX_HEAP || 256) }
  const before = await metrics()
  await json('/api/ai/self/resource', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(policy) })
  await json('/api/ai/self/train/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intervalMs: 500 }) })
  const start = Date.now()
  const samples = []
  while ((Date.now() - start) / 1000 < DURATION_SEC) {
    samples.push(await metrics())
    await new Promise(r => setTimeout(r, 500))
  }
  await json('/api/ai/self/train/stop', { method: 'POST' })
  const after = await metrics()

  const heapMax = Math.max(before.heapMB || 0, ...samples.map(s => s.heapMB || 0), after.heapMB || 0)
  const rssMax = Math.max(before.rssMB || 0, ...samples.map(s => s.rssMB || 0), after.rssMB || 0)

  console.log(JSON.stringify({
    policy,
    baseline: before,
    final: after,
    heapMaxMB: heapMax,
    rssMaxMB: rssMax,
    durationSec: DURATION_SEC,
    samples: samples.length
  }, null, 2))
}

main().catch(e => { console.error('ai-trainer-benchmark failed', e); process.exit(1) })
