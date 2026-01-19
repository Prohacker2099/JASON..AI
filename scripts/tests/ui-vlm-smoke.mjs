#!/usr/bin/env node
import fetch from 'node-fetch'

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

  if (!res.ok) {
    throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(json)}`)
  }

  return json
}

async function runCap(name, input, { simulate = true, sandbox = {} } = {}) {
  return req('POST', '/api/capabilities/run', { name, input, simulate, sandbox })
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const health = await req('GET', '/api/health')
  assert(health && health.status === 'ok', 'health_not_ok')

  const caps = await req('GET', '/api/capabilities')
  assert(caps?.ok === true, 'capabilities_list_failed')

  const names = (caps.capabilities || []).map((c) => c.name)
  assert(names.includes('ui.tree.dump'), 'missing_ui_tree_dump')
  assert(names.includes('ui.control.search'), 'missing_ui_control_search')
  assert(names.includes('ui.ocr.read_text'), 'missing_ui_ocr_read_text')
  assert(names.includes('vlm.visual_click'), 'missing_vlm_visual_click')

  // simulate-only: validates end-to-end wiring without performing real UI actions
  await runCap('ui.tree.dump', { maxItems: 5 }, { simulate: true, sandbox: { allowUI: true } })
  await runCap('ui.control.search', { query: 'ok', maxResults: 3 }, { simulate: true, sandbox: { allowUI: true } })
  await runCap('ui.ocr.read_text', {}, { simulate: true, sandbox: { allowUI: true } })
  await runCap(
    'vlm.visual_click',
    {
      templatePath: 'C:/temp/template.png',
      threshold: 0.8,
      region: { x: 0, y: 0, width: 50, height: 50 },
    },
    { simulate: true, sandbox: { allowUI: true } }
  )

  console.log('UI/VLM SMOKE PASSED (simulate)')
}

main().catch((e) => {
  console.error('UI/VLM SMOKE FAILED:', e?.message || e)
  process.exit(1)
})
