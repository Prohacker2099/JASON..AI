#!/usr/bin/env node
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const BASE = process.env.BASE_URL || 'http://localhost:3001'

async function req(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }

  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(json)}`)
  return json
}

async function waitFor(fn, { timeoutMs = 20000, intervalMs = 400 } = {}) {
  const start = Date.now()
  let lastErr
  while (Date.now() - start < timeoutMs) {
    try {
      const out = await fn()
      if (out) return out
    } catch (e) { lastErr = e }
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw lastErr || new Error('waitFor timeout')
}

async function run() {
  console.log('PASS health -', JSON.stringify(await req('GET', '/api/health')))
  
  const handsStatus = await req('GET', '/api/hands/system/status')
  console.log('PASS hands system status -', JSON.stringify(handsStatus))
  
  console.log('PASS hands browser ensure (headed)')
  await req('POST', '/api/hands/browser/ensure', { headless: false })
  
  const testUrl = `https://example.com/?hands_smoke=${Date.now()}`
  console.log('PASS hands browser navigate -', testUrl)
  await req('POST', '/api/hands/browser/navigate', { 
    url: testUrl,
    guard: { requireApproval: false, waitForIdle: false }
  })
  
  const browserStatus = await req('GET', '/api/hands/browser/status')
  console.log('PASS hands browser status -', JSON.stringify(browserStatus))
  
  const screenshot = await req('POST', '/api/hands/browser/screenshot', {
    guard: { requireApproval: false, waitForIdle: false }
  })
  const buf = Buffer.from(screenshot.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')
  const shotPath = path.join(process.cwd(), 'artifacts', `hands_browser_${Date.now()}.png`)
  fs.mkdirSync(path.dirname(shotPath), { recursive: true })
  fs.writeFileSync(shotPath, buf)
  console.log('PASS hands browser screenshot -', buf.length, 'bytes ->', shotPath)
  
  const sysShot = await req('POST', '/api/hands/system/screenshot', {
    guard: { requireApproval: false, waitForIdle: false }
  })
  const sysBuf = Buffer.from(sysShot.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')
  const sysShotPath = path.join(process.cwd(), 'artifacts', `hands_system_${Date.now()}.png`)
  fs.writeFileSync(sysShotPath, sysBuf)
  console.log('PASS hands system screenshot -', sysBuf.length, 'bytes ->', sysShotPath)
  
  console.log('PASS hands ui status -', JSON.stringify(await req('GET', '/api/hands/ui/status')))
  
  await req('POST', '/api/hands/loop/start', { target: 'system', includeImage: false, intervalMs: 500 })
  await new Promise(r => setTimeout(r, 1200))
  await req('POST', '/api/hands/loop/stop')
  
  console.log('PASS hands loop start/stop')
  console.log('HANDS SMOKE PASSED')
}

run().catch(e => {
  console.error('HANDS SMOKE FAILED:', e)
  process.exit(1)
})
