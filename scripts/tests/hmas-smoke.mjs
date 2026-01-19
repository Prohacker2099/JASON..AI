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
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}`)
  return res.json()
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

function log(step, ok, extra) {
  const s = ok ? '✅' : '❌'
  console.log(`${s} ${step}${extra ? ' - ' + extra : ''}`)
}

async function main() {
  try {
    // 1) Health (wait for server to be ready)
    await waitFor(async () => { try { await req('GET','/api/health'); return true } catch { return false } }, { timeoutMs: 30000, intervalMs: 500 })
    const h = await req('GET','/api/health')
    log('health', true, JSON.stringify(h))

    // 2) DAI hosts allowlist
    let hosts = await req('GET','/api/dai/hosts')
    log('dai hosts (get)', true, JSON.stringify(hosts))
    hosts = await req('POST','/api/dai/hosts', { hosts: ['api.weather.gov','wikipedia.org'] })
    log('dai hosts (post)', true, JSON.stringify(hosts))

    // 3) Persona traits and ingest a risk percept that triggers safety
    await req('POST','/api/agent/persona/traits', { protective: 0.9, calm: 0.8 })
    log('persona traits', true)
    await req('POST','/api/agent/ingest-percept', { type: 'risk_detected', category: ['financial'], riskScore: 0.9, severity: 'high', reason: 'smoke', requiredLevel: 3 })
    log('persona ingest risk percept', true)

    // 4) Verify DAI executed a persona note (via ethics audit log)
    await waitFor(async () => {
      const audit = await req('GET','/api/ethics/audit')
      return Array.isArray(audit) && audit.find(a => a?.type === 'dai_execute' && a?.action?.name === 'persona_note')
    }, { timeoutMs: 15000 })
    log('persona note executed (audit)', true)

    // 5) Orchestrator enqueue and wait
    const enq = await req('POST','/api/orch/enqueue', { goal: 'Plan a trip to Bali next May', priority: 6, simulate: true, sandbox: { allowedHosts: ['api.weather.gov'] } })
    log('orch enqueue', true, enq?.job?.id)
    await waitFor(async () => {
      const st = await req('GET','/api/orch/status')
      // completed when no active and queue length <= 0
      return !st.active && (!st.queued || st.queued.length === 0)
    }, { timeoutMs: 20000 })
    log('orch completed', true)

    // 6) Maintenance start/stop
    const ms = await req('POST','/api/maintenance/start', { intervalMs: 60000, simulate: true })
    log('maintenance start', true)
    const ms2 = await req('POST','/api/maintenance/stop')
    log('maintenance stop', true)

    // 7) Research summarize TEXT (no external network/Puppeteer)
    const longText = 'JASON is an autonomous background agent that operates silently. It plans tasks, executes them via sandboxed adapters, and records immutable activity logs. The system emphasizes least privilege, ethics gating, and spending caps. A persona engine provides a M3GAN-inspired voice for non-interruptive guidance.'
    const sum = await req('POST','/api/research/summarize/text', { text: longText.repeat(5), maxSentences: 3 })
    if (!sum || typeof sum.summary !== 'string' || sum.summary.length === 0) throw new Error('no summary')
    log('research summarize text', true)

    // 8) App allowlist and run (simulate)
    const allow = await req('POST','/api/app/allowlist', { allowlist: ['C\\Windows\\System32\\notepad.exe'] })
    log('app allowlist', true)
    const runApp = await req('POST','/api/app/run', { path: 'C\\Windows\\System32\\notepad.exe', args: [], simulate: true })
    log('app run simulate', true)

    console.log('\nALL SMOKE TESTS PASSED')
  } catch (e) {
    console.error('SMOKE TEST FAILED:', e?.message || e)
    process.exit(1)
  }
}

main()
