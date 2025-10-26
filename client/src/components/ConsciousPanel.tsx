import React, { useEffect, useMemo, useRef, useState } from 'react'

async function getJson<T = any>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}
async function postJson<T = any>(url: string, body?: any): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

const Row: React.FC<{ label: string; children: React.ReactNode }>
  = ({ label, children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
    <div style={{ width: 220, fontWeight: 600 }}>{label}</div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
)

const Card: React.FC<{ title: string; children: React.ReactNode }>
  = ({ title, children }) => (
  <div style={{ background: '#11161B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{ ...(props.style||{}), background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '6px 8px' }} />
)

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
  <button {...rest} style={{ ...(rest.style||{}), background: '#1F2A34', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>{children}</button>
)

const Pre: React.FC<{ data: any; maxHeight?: number }> = ({ data, maxHeight = 220 }) => (
  <div style={{ maxHeight, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{(() => { try { return JSON.stringify(data, null, 2) } catch { return String(data) } })()}</pre>
  </div>
)

const ConsciousPanel: React.FC = () => {
  const [status, setStatus] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [goal, setGoal] = useState<string>('Grow competence through safe exploration')
  const [simulate, setSimulate] = useState<boolean>(true)
  const [intervalMs, setIntervalMs] = useState<number>(1500)
  const [observeText, setObserveText] = useState<string>('')
  const [feed, setFeed] = useState<any[]>([])
  const [voiceOn, setVoiceOn] = useState<boolean>(false)
  const [eco, setEco] = useState<boolean>(false)
  const esRef = useRef<EventSource | null>(null)

  const load = async () => {
    try {
      const [st, lg] = await Promise.all([
        getJson('/api/ai/conscious/status'),
        getJson('/api/ai/conscious/logs?limit=50')
      ])
      setStatus(st)
      setLogs(lg)
    } catch {}
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const es = new EventSource('/api/events')
    esRef.current = es
    const onThought = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        setFeed(prev => [{ t: new Date().toLocaleTimeString(), ...data }, ...prev].slice(0, 100))
        if (voiceOn) {
          const text = data?.thought?.text || ''
          if (text && typeof window !== 'undefined' && (window as any).speechSynthesis) {
            try {
              const u = new (window as any).SpeechSynthesisUtterance(text)
              u.rate = 1.0
              u.pitch = 1.0
              ;(window as any).speechSynthesis.speak(u)
            } catch {}
          }
        }
      } catch {}
    }
    es.addEventListener('ai:conscious:thought', onThought as any)
    return () => { try { es.removeEventListener('ai:conscious:thought', onThought as any); es.close() } catch {} }
  }, [])

  const start = async () => {
    await postJson('/api/ai/conscious/start', { goal, simulate, intervalMs })
    await load()
  }
  const stop = async () => { await postJson('/api/ai/conscious/stop'); await load() }
  const observe = async () => { await postJson('/api/ai/conscious/observe', { text: observeText }); setObserveText(''); await load() }

  const applyEco = async (on: boolean) => {
    setEco(on)
    try {
      // Resource limits for self-learning engine
      await postJson('/api/ai/self/resource', { maxRps: on ? 0.5 : 2, maxConcurrent: 1, maxHeapMB: on ? 256 : 512 })
    } catch {}
    try {
      // Background micro-trainer cadence
      await postJson('/api/ai/self/scheduler/config', {
        microIntervalMinutes: on ? 15 : 5,
        batchSize: on ? 64 : 128,
        maxBatchesPerRun: on ? 2 : 6,
        maxHeapMB: on ? 256 : 512
      })
    } catch {}
    await load()
  }

  const wm = status?.workingMemory || { observations: [], thoughts: [] }

  return (
    <div style={{ color: '#fff', background: '#0B0F14', minHeight: '100vh', padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Consciousness (Text-based)</div>
        <div style={{ opacity: 0.7 }}>
          {status?.running ? <span style={{ color: '#81C784' }}>RUNNING</span> : <span style={{ color: '#E57373' }}>STOPPED</span>}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Btn onClick={load}>Refresh</Btn>
          <a href="#/" style={{ marginLeft: 12, color: '#90CAF9' }}>Home</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Control">
          <Row label="Goal"><Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="What should it aim for?" /></Row>
          <Row label="Simulate"><label><input type="checkbox" checked={simulate} onChange={e => setSimulate(e.target.checked)} /> <span style={{ marginLeft: 6 }}>{simulate ? 'On' : 'Off'}</span></label></Row>
          <Row label={`Interval: ${intervalMs} ms`}>
            <input type="range" min={200} max={5000} step={100} value={intervalMs} onChange={e => setIntervalMs(Number(e.target.value))} />
          </Row>
          <Row label="Voice (speak thoughts)"><label><input type="checkbox" checked={voiceOn} onChange={e => setVoiceOn(e.target.checked)} /> <span style={{ marginLeft: 6 }}>{voiceOn ? 'On' : 'Off'}</span></label></Row>
          <Row label="Eco Mode"><label><input type="checkbox" checked={eco} onChange={e => void applyEco(e.target.checked)} /> <span style={{ marginLeft: 6 }}>{eco ? 'On' : 'Off'}</span></label></Row>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={start}>Start</Btn>
            <Btn onClick={stop}>Stop</Btn>
          </div>
        </Card>

        <Card title="Status">
          {status ? <Pre data={status} /> : <div>Loading…</div>}
        </Card>

        <Card title="Observe (inject context)">
          <Row label="Text">
            <Input value={observeText} onChange={e => setObserveText(e.target.value)} placeholder="e.g., Build a summary of today's tasks" />
          </Row>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={observe}>Observe</Btn>
          </div>
        </Card>

        <Card title="Working Memory (recent)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Observations</div>
              <Pre data={wm.observations} />
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Thoughts</div>
              <Pre data={wm.thoughts} />
            </div>
          </div>
        </Card>

        <Card title="Live Feed (SSE: ai:conscious:thought)">
          <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
            {feed.length === 0 ? <div style={{ opacity: 0.7 }}>No events yet.</div> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {feed.map((f, i) => (
                  <li key={i} style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', padding: '6px 0' }}>
                    <div style={{ opacity: 0.7 }}>{f.t}</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{(() => { try { return JSON.stringify(f, null, 2) } catch { return String(f) } })()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card title="Recent Logs">
          <Pre data={logs} />
        </Card>
      </div>
    </div>
  )
}

export default ConsciousPanel
