import fetch from 'node-fetch'

const base = 'http://localhost:3001'

async function main() {
  try {
    const health = await (await fetch(base + '/api/health')).json()
    console.log('health', health)

    const status = await (await fetch(base + '/api/ai/self/status')).json()
    console.log('status', status)

    const setWeights = await (await fetch(base + '/api/ai/self/weights', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ morality: 2, kindness: 1, courage: 0.5 })
    })).json()
    console.log('setWeights', setWeights)

    const resource = await (await fetch(base + '/api/ai/self/resource', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxRps: 1, maxConcurrent: 1, maxHeapMB: 256 })
    })).json()
    console.log('resource', resource)

    const start = await (await fetch(base + '/api/ai/self/train/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervalMs: 1000 })
    })).json()
    console.log('train start', start)

    await new Promise(r => setTimeout(r, 1500))

    const stop = await (await fetch(base + '/api/ai/self/train/stop', { method: 'POST' })).json()
    console.log('train stop', stop)
  } catch (e) {
    console.error('smoke failed', e)
    process.exit(1)
  }
}

main()
