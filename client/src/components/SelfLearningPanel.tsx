import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Status = {
  stateSize: number
  actionSize: number
  epsilon: number
  steps: number
  memory: number
  training: boolean
  lastLoss: number | null
  modelDir: string
  resourcePolicy?: { maxRps: number; maxConcurrent: number; maxHeapMB: number }
}

type Weights = {
  morality: number
  kindness: number
  courage: number
  determination: number
  empathy: number
  helpfulness: number
}

const num = (v: any, d = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

const baseUrl = `${location.protocol}//${location.hostname}:3001`
const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3001`

const SelfLearningPanel: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null)
  const [weights, setWeights] = useState<Weights | null>(null)
  const [intervalMs, setIntervalMs] = useState<number>(1000)
  const [policy, setPolicy] = useState<{ maxRps: number; maxConcurrent: number; maxHeapMB: number }>({ maxRps: 2, maxConcurrent: 1, maxHeapMB: 512 })
  const [log, setLog] = useState<any[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const fetchStatus = useCallback(async () => {
    const res = await fetch(`${baseUrl}/api/ai/self/status`)
    const json = await res.json()
    setStatus(json)
    if (json?.resourcePolicy) setPolicy(json.resourcePolicy)
  }, [])

  const fetchWeights = useCallback(async () => {
    const res = await fetch(`${baseUrl}/api/ai/self/weights`)
    const json = await res.json()
    setWeights(json)
  }, [])

  useEffect(() => {
    void fetchStatus()
    void fetchWeights()
  }, [fetchStatus, fetchWeights])

  const connectWs = useCallback(() => {
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onmessage = ev => {
        try {
          const data = JSON.parse(String(ev.data || ''))
          setLog(prev => {
            const next = [{ ts: Date.now(), data }, ...prev].slice(0, 100)
            return next
          })
        } catch {}
      }
      ws.onopen = () => {
        setLog(prev => [{ ts: Date.now(), data: { type: 'ws_open' } }, ...prev])
      }
      ws.onclose = () => {
        setLog(prev => [{ ts: Date.now(), data: { type: 'ws_close' } }, ...prev])
      }
    } catch {}
  }, [])

  useEffect(() => {
    connectWs()
    return () => { try { wsRef.current?.close() } catch {} }
  }, [connectWs])

  const startTraining = useCallback(async () => {
    await fetch(`${baseUrl}/api/ai/self/train/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intervalMs: num(intervalMs, 1000) }) })
    void fetchStatus()
  }, [intervalMs, fetchStatus])

  const stopTraining = useCallback(async () => {
    await fetch(`${baseUrl}/api/ai/self/train/stop`, { method: 'POST' })
    void fetchStatus()
  }, [fetchStatus])

  const updateWeights = useCallback(async () => {
    if (!weights) return
    await fetch(`${baseUrl}/api/ai/self/weights`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(weights) })
    void fetchWeights()
  }, [weights, fetchWeights])

  const updatePolicy = useCallback(async () => {
    await fetch(`${baseUrl}/api/ai/self/resource`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(policy) })
    void fetchStatus()
  }, [policy, fetchStatus])

  const decideSample = useCallback(async () => {
    const st = Array.from({ length: status?.stateSize || 8 }, () => Math.random())
    const actions = [
      { type: 'process', payload: { command: 'echo', args: ['hello'] }, riskLevel: 0.1, tags: ['help'] },
      { type: 'http', payload: { url: `${baseUrl}/api/health`, method: 'GET' }, riskLevel: 0.05, tags: ['safe'] },
      { type: 'device', payload: { deviceId: 'demo', command: 'toggle' }, riskLevel: 0.3, tags: ['risk'] },
      { type: 'process', payload: { command: 'echo', args: ['world'] }, riskLevel: 0.1, tags: ['help'] }
    ]
    const res = await fetch(`${baseUrl}/api/ai/self/decide`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: st, actions, explore: true }) })
    const json = await res.json()
    setLog(prev => [{ ts: Date.now(), data: { type: 'decide_result', json } }, ...prev])
  }, [status])

  const WeightInput = useCallback(({ k }: { k: keyof Weights }) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ width: 120 }}>{k}</label>
      <input type="number" step="0.1" min={0} max={10} value={num(weights?.[k], 1)} onChange={e => setWeights(w => ({ ...(w || {} as any), [k]: num(e.target.value, 1) }))} />
    </div>
  ), [weights])

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
        <h2>Self-Learning Status</h2>
        <button onClick={() => { void fetchStatus() }}>Refresh</button>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 6 }}>
          <div>stateSize</div><div>{status?.stateSize}</div>
          <div>actionSize</div><div>{status?.actionSize}</div>
          <div>epsilon</div><div>{status?.epsilon?.toFixed?.(3)}</div>
          <div>steps</div><div>{status?.steps}</div>
          <div>memory</div><div>{status?.memory}</div>
          <div>training</div><div>{String(status?.training)}</div>
          <div>lastLoss</div><div>{status?.lastLoss ?? ''}</div>
          <div>modelDir</div><div style={{ wordBreak: 'break-all' }}>{status?.modelDir}</div>
          <div>policy</div><div>{status?.resourcePolicy ? JSON.stringify(status.resourcePolicy) : ''}</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" value={intervalMs} onChange={e => setIntervalMs(num(e.target.value, 1000))} />
          <button onClick={() => { void startTraining() }}>Start</button>
          <button onClick={() => { void stopTraining() }}>Stop</button>
          <button onClick={() => { void decideSample() }}>Decide Sample</button>
        </div>
      </div>

      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
        <h2>Value Weights</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <WeightInput k="morality" />
          <WeightInput k="kindness" />
          <WeightInput k="courage" />
          <WeightInput k="determination" />
          <WeightInput k="empathy" />
          <WeightInput k="helpfulness" />
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => { void updateWeights() }}>Save Weights</button>
          <button style={{ marginLeft: 8 }} onClick={() => { void fetchWeights() }}>Reload</button>
        </div>
      </div>

      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
        <h2>Resource Policy</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8 }}>
          <label>maxRps</label>
          <input type="number" step="0.1" value={policy.maxRps} onChange={e => setPolicy(p => ({ ...p, maxRps: num(e.target.value, 2) }))} />
          <label>maxConcurrent</label>
          <input type="number" step={1} value={policy.maxConcurrent} onChange={e => setPolicy(p => ({ ...p, maxConcurrent: Math.max(1, Math.floor(num(e.target.value, 1))) }))} />
          <label>maxHeapMB</label>
          <input type="number" step={1} value={policy.maxHeapMB} onChange={e => setPolicy(p => ({ ...p, maxHeapMB: Math.max(64, Math.floor(num(e.target.value, 512))) }))} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => { void updatePolicy() }}>Apply Policy</button>
        </div>
      </div>

      <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, gridColumn: '1 / span 2' }}>
        <h2>Telemetry</h2>
        <div style={{ maxHeight: 240, overflow: 'auto', fontFamily: 'monospace', fontSize: 12, background: '#111', color: '#0f0', padding: 8 }}>
          {log.map((e, idx) => (
            <div key={idx}>{new Date(e.ts).toISOString()} {JSON.stringify(e.data)}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SelfLearningPanel
