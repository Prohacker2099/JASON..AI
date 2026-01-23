import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type HandsStatus = {
  ok: boolean
  status?: { started: boolean; headless: boolean; startedAt: number | null; url: string; title: string }
  error?: string
}

type LoopEvent = {
  id: string
  timestamp: number
  target: 'browser' | 'system'
  url?: string
  title?: string
  dataUrl?: string
  error?: string
}

async function getJson<T = any>(url: string): Promise<T> {
  const r = await fetch(url)
  const t = await r.text()
  let j: any
  try { j = JSON.parse(t) } catch { j = { raw: t } }
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j)}`)
  return j
}

async function postJson<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
  const t = await r.text()
  let j: any
  try { j = JSON.parse(t) } catch { j = { raw: t } }
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j)}`)
  return j
}

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16 }}>
    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      ...(props.style || {}),
      background: 'transparent',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 10,
      padding: '10px 12px',
      outline: 'none',
    }}
  />
)

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    style={{
      ...(props.style || {}),
      background: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: 10,
      padding: '10px 12px',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.6 : 1,
      fontWeight: 800,
    }}
  />
)

const HandsConsole: React.FC = () => {
  const [status, setStatus] = useState<HandsStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string>('')

  const [url, setUrl] = useState('https://example.com')
  const [lastImage, setLastImage] = useState<string>('')
  const [lastSystemImage, setLastSystemImage] = useState<string>('')

  const [loopRunning, setLoopRunning] = useState(false)
  const [loopIntervalMs, setLoopIntervalMs] = useState<number>(2000)
  const [loopIncludeImage, setLoopIncludeImage] = useState<boolean>(false)
  const [loopTarget, setLoopTarget] = useState<'browser' | 'system'>('browser')
  const [loopEvents, setLoopEvents] = useState<LoopEvent[]>([])

  const esRef = useRef<EventSource | null>(null)

  const refreshStatus = useCallback(async () => {
    const s = await getJson<HandsStatus>('/api/hands/browser/status')
    setStatus(s)
  }, [])

  const safeRun = useCallback(async (fn: () => Promise<void>) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }, [])

  const connectSse = useCallback(() => {
    if (esRef.current) return
    const es = new EventSource('/api/events')
    es.addEventListener('hands:loop', (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        setLoopEvents((prev) => [data, ...prev].slice(0, 50))
      } catch {
        setLoopEvents((prev) => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now(), target: 'browser', error: String(ev.data) }, ...prev].slice(0, 50))
      }
    })
    es.onerror = () => { }
    esRef.current = es
  }, [])

  useEffect(() => {
    connectSse()
    return () => { try { esRef.current?.close() } catch { } esRef.current = null }
  }, [connectSse])

  useEffect(() => {
    void safeRun(async () => { await refreshStatus() })
  }, [refreshStatus, safeRun])

  const links = useMemo(() => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
      <a href="#/" style={{ color: '#93c5fd' }}>Home</a>
      <a href="#/ai" style={{ color: '#93c5fd' }}>AI</a>
      <a href="#/ethics" style={{ color: '#93c5fd' }}>Ethics</a>
      <a href="#/conscious" style={{ color: '#93c5fd' }}>Conscious</a>
      <a href="#/travel" style={{ color: '#93c5fd' }}>Travel</a>
    </div>
  ), [])

  return (
    <div style={{ padding: 18, fontFamily: 'Inter, system-ui, sans-serif', color: '#fff' }}>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Hands Console</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Drive browser + system capture + loop via /api/hands</div>
      {links}

      {err ? (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', padding: 12, borderRadius: 12, marginBottom: 12 }}>
          {err}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        <Card title="Browser">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Button disabled={busy} onClick={() => safeRun(async () => { await postJson('/api/hands/browser/ensure', { headless: false }); await refreshStatus() })}>Ensure Headed</Button>
            <Button disabled={busy} onClick={() => safeRun(async () => { await postJson('/api/hands/browser/ensure', { headless: true }); await refreshStatus() })} style={{ background: '#334155' }}>Ensure Headless</Button>
            <Button disabled={busy} onClick={() => safeRun(async () => { await refreshStatus() })} style={{ background: '#334155' }}>Refresh</Button>
            <Button disabled={busy} onClick={() => safeRun(async () => { await postJson('/api/hands/browser/close', {}); await refreshStatus() })} style={{ background: '#7c2d12' }}>Close</Button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
            <Button disabled={busy || !url.trim()} onClick={() => safeRun(async () => {
              const out = await postJson('/api/hands/browser/navigate', { url, headless: false, guard: { requireApproval: false, waitForIdle: false } })
              setStatus({ ok: true, status: { started: true, headless: false, startedAt: (out as any).startedAt || null, url: (out as any).url || url, title: (out as any).title || '' } })
            })}>Go</Button>
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
            <div>URL: <span style={{ color: '#fff' }}>{status?.status?.url || ''}</span></div>
            <div>Title: <span style={{ color: '#fff' }}>{status?.status?.title || ''}</span></div>
            <div>Headless: <span style={{ color: '#fff' }}>{String(status?.status?.headless ?? '')}</span></div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Button disabled={busy} onClick={() => safeRun(async () => {
              const out = await postJson('/api/hands/browser/screenshot', { fullPage: true, guard: { requireApproval: false, waitForIdle: false } })
              setLastImage((out as any).dataUrl || '')
              await refreshStatus()
            })}>Screenshot</Button>
          </div>

          {lastImage ? (
            <img src={lastImage} style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }} />
          ) : null}
        </Card>

        <Card title="System + Loop">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Button disabled={busy} onClick={() => safeRun(async () => {
              const out = await postJson('/api/hands/system/screenshot', { guard: { requireApproval: false, waitForIdle: false } })
              setLastSystemImage((out as any).dataUrl || '')
            })}>System Screenshot</Button>
            <Button disabled={busy} onClick={() => safeRun(async () => {
              const out = await postJson('/api/hands/loop/tick', {})
              setLoopRunning(true)
              void out
            })} style={{ background: '#334155' }}>Loop Tick</Button>
            <Button disabled={busy} onClick={() => safeRun(async () => {
              await postJson('/api/hands/loop/clear', {})
              setLoopEvents([])
            })} style={{ background: '#334155' }}>Clear Events</Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Interval (ms)</div>
              <Input
                type="number"
                value={String(loopIntervalMs)}
                onChange={(e) => setLoopIntervalMs(Number(e.target.value || 0))}
                min={250}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Target</div>
              <select
                value={loopTarget}
                onChange={(e) => setLoopTarget(e.target.value === 'system' ? 'system' : 'browser')}
                style={{ width: '100%', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 12px' }}
              >
                <option value="browser">browser</option>
                <option value="system">system</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <input type="checkbox" checked={loopIncludeImage} onChange={(e) => setLoopIncludeImage(e.target.checked)} />
            <span>Include image in loop events</span>
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Button disabled={busy} onClick={() => safeRun(async () => {
              await postJson('/api/hands/loop/start', {
                intervalMs: loopIntervalMs,
                includeImage: loopIncludeImage,
                target: loopTarget,
                emitSse: true,
                guard: { requireApproval: false, waitForIdle: false },
              })
              setLoopRunning(true)
            })}>Start Loop</Button>
            <Button disabled={busy} onClick={() => safeRun(async () => {
              await postJson('/api/hands/loop/stop', {})
              setLoopRunning(false)
            })} style={{ background: '#7c2d12' }}>Stop Loop</Button>
            <Button disabled={busy} onClick={() => safeRun(async () => {
              const out = await getJson('/api/hands/loop/events?limit=50')
              const evs = Array.isArray((out as any).events) ? (out as any).events : []
              setLoopEvents(evs)
            })} style={{ background: '#334155' }}>Fetch Events</Button>
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>Running: <span style={{ color: '#fff' }}>{String(loopRunning)}</span> | Events: <span style={{ color: '#fff' }}>{loopEvents.length}</span></div>

          {lastSystemImage ? (
            <img src={lastSystemImage} style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 }} />
          ) : null}

          <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 }}>
            {loopEvents.map((e) => (
              <div key={e.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 800 }}>{new Date(e.timestamp).toLocaleTimeString()} — {e.target}{e.error ? ' — ERROR' : ''}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)' }}>{e.url || e.title || e.error || ''}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default HandsConsole
