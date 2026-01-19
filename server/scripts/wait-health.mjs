import fetch from 'node-fetch'

const base = process.env.BASE_URL || 'http://127.0.0.1:3001'
const url = base + '/api/health'
const argv = process.argv.slice(2)
const argTimeout = argv.find(a => a.startsWith('--timeout-ms='))
const timeoutMs = Number((argTimeout ? argTimeout.split('=')[1] : undefined) || process.env.TIMEOUT_MS || 60000)

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)) }

;(async () => {
  const start = Date.now()
  let attempt = 0
  while (Date.now() - start < timeoutMs) {
    attempt++
    try {
      const res = await fetch(url)
      if (res.ok) {
        const j = await res.json().catch(()=>({}))
        console.log('HEALTH OK', j)
        process.exit(0)
      }
    } catch (e) {
      // ignore and retry
    }
    await sleep(1000)
  }
  console.error('HEALTH TIMEOUT after', attempt, 'tries')
  process.exit(1)
})()
