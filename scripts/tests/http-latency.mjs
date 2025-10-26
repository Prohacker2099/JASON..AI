// Simple HTTP latency and throughput test using global fetch (Node 18+)
const BASE = process.env.SERVER || 'http://localhost:3001'
const PATHS = (process.env.PATHS || '/api/health,/api/dev/sys-metrics').split(',')
const TOTAL = Number(process.env.TOTAL || 500)
const CONC = Number(process.env.CONC || 50)

function pct(arr, p) {
  const a = [...arr].sort((x, y) => x - y)
  const i = Math.min(a.length - 1, Math.max(0, Math.floor((p / 100) * a.length)))
  return a[i]
}

async function hit(path) {
  const t0 = performance.now()
  const res = await fetch(BASE + path).catch(() => null)
  const t1 = performance.now()
  return { ok: !!(res && res.ok), ms: t1 - t0, path }
}

async function runPath(path) {
  const latencies = []
  let ok = 0
  let fail = 0
  const start = Date.now()
  const inflight = new Set()
  let sent = 0
  async function pump() {
    while (sent < TOTAL) {
      if (inflight.size >= CONC) {
        await new Promise(r => setTimeout(r, 1))
        continue
      }
      const p = (async () => {
        try {
          const r = await hit(path)
          if (r.ok) ok++
          else fail++
          latencies.push(r.ms)
        } catch { fail++ } finally { inflight.delete(p) }
      })()
      inflight.add(p)
      sent++
    }
  }
  await pump()
  await Promise.allSettled([...inflight])
  const dur = (Date.now() - start) / 1000
  const rps = (ok + fail) / dur
  return {
    path,
    total: ok + fail,
    ok, fail, rps, durationSec: dur,
    p50: pct(latencies, 50).toFixed(2),
    p90: pct(latencies, 90).toFixed(2),
    p99: pct(latencies, 99).toFixed(2)
  }
}

async function main() {
  const results = []
  for (const path of PATHS) {
    results.push(await runPath(path.trim()))
  }
  console.log(JSON.stringify({ base: BASE, total: TOTAL, conc: CONC, results }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
