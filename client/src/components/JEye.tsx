import React, { useEffect, useMemo, useState } from 'react'

function postJson(url: string, body: any) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

type TrustPrompt = {
  id: string
  level: 1|2|3
  title: string
  rationale?: string
  options: Array<'approve'|'reject'|'delay'>
  createdAt: number
  meta?: any
}

type FeedItem = { id: string; type: string; time: string; payload: any }

const JEye: React.FC = () => {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [status, setStatus] = useState<'idle'|'exec'|'awaiting'>('idle')
  const [prompt, setPrompt] = useState<TrustPrompt | null>(null)
  const [paused, setPaused] = useState<boolean>(false)
  const [voiceOn, setVoiceOn] = useState<boolean>(false)
  const [rec, setRec] = useState<any>(null)

  useEffect(() => {
    const es = new EventSource('/api/events')
    const add = (type: string, payload: any) => {
      setFeed(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type, time: new Date().toLocaleTimeString(), payload }, ...prev].slice(0, 50))
    }
    const onAny = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        add(ev.type, data)
        if (ev.type === 'ai:self:event' && data && typeof data === 'object' && (data as any).type === 'act') {
          setStatus('exec')
          setTimeout(() => setStatus('idle'), 1500)
        }
      } catch {}
    }
    const onPrompt = (ev: MessageEvent) => {
      try { const data = JSON.parse(ev.data) as TrustPrompt; setPrompt(data); setStatus('awaiting'); add('trust:prompt', data) } catch {}
    }
    const onDecision = (ev: MessageEvent) => {
      try { const data = JSON.parse(ev.data); add('trust:decision', data); setStatus('idle'); if (prompt && data?.id === prompt.id) setPrompt(null) } catch {}
    }

    es.addEventListener('ai:self:event', onAny)
    es.addEventListener('ai:self:trained', onAny)
    es.addEventListener('energy:reading', onAny)
    es.addEventListener('energy:optimized', onAny)
    es.addEventListener('trust:prompt', onPrompt)
    es.addEventListener('trust:decision', onDecision)
    es.addEventListener('trust:kill', (ev: MessageEvent) => { try { const d = JSON.parse(ev.data); setPaused(!!d.paused); add('trust:kill', d) } catch {} })

    return () => { es.close() }
  }, [prompt])

  useEffect(() => {
    if (!voiceOn) {
      if (rec && typeof rec.stop === 'function') { try { rec.stop() } catch {} }
      setRec(null)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = 'en-US'
    r.continuous = true
    r.interimResults = false
    r.onresult = async (ev: any) => {
      try {
        const tr = String(ev.results?.[ev.results.length - 1]?.[0]?.transcript || '').toLowerCase()
        const pauseCmd = /^(hey\s+jason,?\s+)?(pause(\s+all)?|(pause\s+tasks)|(pause\s+everything))/.test(tr)
        const resumeCmd = /^(hey\s+jason,?\s+)?(resume(\s+all)?|(resume\s+tasks)|(resume\s+everything))/.test(tr)
        if (pauseCmd) {
          await postJson('/api/trust/kill', { paused: true })
          setPaused(true)
          setFeed(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: 'voice:pause', time: new Date().toLocaleTimeString(), payload: { transcript: tr } }, ...prev].slice(0, 50))
        } else if (resumeCmd) {
          await postJson('/api/trust/kill', { paused: false })
          setPaused(false)
          setFeed(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: 'voice:resume', time: new Date().toLocaleTimeString(), payload: { transcript: tr } }, ...prev].slice(0, 50))
        }
      } catch {}
    }
    r.onend = () => { try { if (voiceOn) r.start() } catch {} }
    try { r.start() } catch {}
    setRec(r)
    return () => { try { r.onresult = null; r.onend = null; r.stop() } catch {} }
  }, [voiceOn])

  const borderColor = useMemo(() => {
    if (status === 'awaiting') return '#FFD54F' // yellow
    if (status === 'exec') return '#4CAF50' // green
    return '#42A5F5' // blue
  }, [status])

  const approve = async (decision: 'approve'|'reject'|'delay') => {
    if (!prompt) return
    try {
      await postJson('/api/trust/decide', { id: prompt.id, decision })
      setStatus('idle'); setPrompt(null)
    } catch {}
  }

  const toggleKill = async () => {
    const next = !paused
    try { await postJson('/api/trust/kill', { paused: next }); setPaused(next) } catch {}
  }

  return (
    <>
      <div style={{ position: 'fixed', right: 16, bottom: 16, width: 280, background: 'rgba(20,24,28,0.9)', color: '#fff', border: `2px solid ${borderColor}`, borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.4)', zIndex: 9999, overflow: 'hidden', fontFamily: 'ui-sans-serif, system-ui', backdropFilter: 'blur(6px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: borderColor, marginRight: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14 }}>J-Eye</div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setVoiceOn(v => !v)} style={{ background: 'transparent', color: voiceOn ? '#9CCC65' : '#B0BEC5', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginRight: 6 }}>{voiceOn ? 'Voice On' : 'Voice Off'}</button>
            <button onClick={toggleKill} style={{ background: 'transparent', color: paused ? '#FF6E6E' : '#9CCC65', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{paused ? 'Resume' : 'Kill'}</button>
          </div>
        </div>
        <div style={{ maxHeight: 180, overflowY: 'auto', padding: 8, fontSize: 12 }}>
          {feed.length === 0 ? <div style={{ opacity: 0.7 }}>No activity yet.</div> : feed.map(item => (
            <div key={item.id} style={{ marginBottom: 6 }}>
              <div style={{ opacity: 0.7 }}>{item.time} · {item.type}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{(() => { try { return JSON.stringify(item.payload) } catch { return String(item.payload) } })()}</div>
            </div>
          ))}
        </div>
      </div>
      {prompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 'min(560px, 92vw)', background: '#151A20', color: '#fff', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Level 3 Confirmation Required</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{prompt.title}</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>{prompt.rationale}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {prompt.options.includes('delay') && <button onClick={() => approve('delay')} style={{ background: 'transparent', color: '#FFD54F', border: '1px solid #FFD54F', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Delay 1h</button>}
              {prompt.options.includes('reject') && <button onClick={() => approve('reject')} style={{ background: 'transparent', color: '#FF6E6E', border: '1px solid #FF6E6E', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Reject</button>}
              {prompt.options.includes('approve') && <button onClick={() => approve('approve')} style={{ background: '#4CAF50', color: '#fff', border: '1px solid #4CAF50', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Confirm & Proceed</button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default JEye

