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
  if (lastErr) throw lastErr
  throw new Error('waitFor timeout')
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function decodeDataUrlToFile(dataUrl, outPath) {
  assert(typeof dataUrl === 'string' && dataUrl.includes(','), 'invalid_dataUrl')
  const b64 = dataUrl.split(',')[1]
  const buf = Buffer.from(b64, 'base64')
  fs.writeFileSync(outPath, buf)
  return buf.length
}

function log(step, ok, extra) {
  const s = ok ? 'PASS' : 'FAIL'
  console.log(`${s} ${step}${extra ? ' - ' + extra : ''}`)
}

async function main() {
  try {
    await waitFor(async () => { try { await req('GET', '/api/health'); return true } catch { return false } }, { timeoutMs: 30000, intervalMs: 500 })
    const health = await req('GET', '/api/health')
    log('health', true, JSON.stringify(health))

    const sys = await req('GET', '/api/hands/system/status')
    assert(sys?.ok === true, 'hands_system_status_failed')
    log('hands system status', true, JSON.stringify({ platform: sys.platform, paused: sys.paused }))

    const ensure = await req('POST', '/api/hands/browser/ensure', { headless: false })
    assert(ensure?.ok === true, 'hands_browser_ensure_failed')
    log('hands browser ensure (headed)', true)

    const ts = Date.now()
    const target = `https://example.com/?hands_smoke=${ts}`
    const nav = await req('POST', '/api/hands/browser/navigate', { url: target, waitUntil: 'domcontentloaded', timeoutMs: 30000, headless: false, guard: { requireApproval: false, waitForIdle: false } })
    assert(nav?.ok === true, 'hands_browser_navigate_failed')
    log('hands browser navigate', true, target)

    const st = await req('GET', '/api/hands/browser/status')
    assert(st?.ok === true, 'hands_browser_status_failed')
    assert(st?.status?.url === target, 'hands_browser_status_url_mismatch')
    assert(typeof st?.status?.title === 'string' && st.status.title.length > 0, 'hands_browser_status_title_empty')
    log('hands browser status', true, JSON.stringify({ url: st.status.url, title: st.status.title, headless: st.status.headless }))

    const shot = await req('POST', '/api/hands/browser/screenshot', { fullPage: true, guard: { requireApproval: false, waitForIdle: false } })
    const outDir = path.resolve(process.cwd(), 'artifacts')
    try { fs.mkdirSync(outDir, { recursive: true }) } catch { }
    const outPath = path.join(outDir, `hands_browser_${ts}.png`)
    const bytes = decodeDataUrlToFile(shot?.dataUrl, outPath)
    assert(bytes > 5000, 'hands_browser_screenshot_too_small')
    log('hands browser screenshot', true, `${bytes} bytes -> ${outPath}`)

    if (String(sys.platform || '').toLowerCase().includes('win')) {
      const sysShot = await req('POST', '/api/hands/system/screenshot', { guard: { requireApproval: false, waitForIdle: false } })
      const sysPath = path.join(outDir, `hands_system_${ts}.png`)
      const sysBytes = decodeDataUrlToFile(sysShot?.dataUrl, sysPath)
      assert(sysBytes > 5000, 'hands_system_screenshot_too_small')
      log('hands system screenshot', true, `${sysBytes} bytes -> ${sysPath}`)

      const uiStatus = await req('GET', '/api/hands/ui/status')
      assert(uiStatus?.ok === true, 'hands_ui_status_failed')
      log('hands ui status', true, JSON.stringify({ platform: uiStatus.platform, paused: uiStatus.paused }))
    } else {
      log('hands system/ui tests (skipped)', true, 'non-windows')
    }

    const loopStart = await req('POST', '/api/hands/loop/start', { intervalMs: 500, includeImage: false, target: 'browser', emitSse: false, guard: { requireApproval: false, waitForIdle: false } })
    assert(loopStart?.ok === true, 'hands_loop_start_failed')
    await new Promise(r => setTimeout(r, 1200))
    const loopStop = await req('POST', '/api/hands/loop/stop', {})
    assert(loopStop?.ok === true, 'hands_loop_stop_failed')
    log('hands loop start/stop', true)

    console.log('\nHANDS SMOKE PASSED')
  } catch (e) {
    console.error('HANDS SMOKE FAILED:', e?.message || e)
    process.exit(1)
  }
}

main()
