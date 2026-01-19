import React, { useEffect, useMemo, useRef, useState } from 'react'

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
  const [voiceBackend, setVoiceBackend] = useState<'webspeech'|'local'>('webspeech')
  const [rec, setRec] = useState<any>(null)
  const lastVoiceRef = useRef<string>('')
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const recordingRef = useRef<boolean>(false)
  const silenceAtRef = useRef<number | null>(null)
  const lastSendAtRef = useRef<number>(0)

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
    es.addEventListener('orch:job', onAny)
    es.addEventListener('trust:prompt', onPrompt)
    es.addEventListener('trust:decision', onDecision)
    es.addEventListener('trust:kill', (ev: MessageEvent) => { try { const d = JSON.parse(ev.data); setPaused(!!d.paused); add('trust:kill', d) } catch {} })

    return () => { es.close() }
  }, [prompt])

  useEffect(() => {
    let cancelled = false

    const stopLocal = async () => {
      try {
        if (rafRef.current !== null) {
          try { cancelAnimationFrame(rafRef.current) } catch {}
          rafRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try { mediaRecorderRef.current.stop() } catch {}
        }
        mediaRecorderRef.current = null
        recordingRef.current = false
        silenceAtRef.current = null
        chunksRef.current = []

        if (streamRef.current) {
          try { streamRef.current.getTracks().forEach(t => { try { t.stop() } catch {} }) } catch {}
        }
        streamRef.current = null

        if (audioCtxRef.current) {
          try { await audioCtxRef.current.close() } catch {}
        }
        audioCtxRef.current = null
        analyserRef.current = null
      } catch {}
    }

    const speak = (reply: string) => {
      try {
        const synth = (window as any).speechSynthesis
        if (synth && typeof (window as any).SpeechSynthesisUtterance === 'function') {
          const u = new (window as any).SpeechSynthesisUtterance(String(reply || ''))
          u.lang = 'en-US'
          synth.cancel()
          synth.speak(u)
        }
      } catch {}
    }

    const sendAudio = async (blob: Blob) => {
      const now = Date.now()
      if (now - lastSendAtRef.current < 700) return
      lastSendAtRef.current = now
      try {
        const fd = new FormData()
        fd.append('audio', blob, 'audio.webm')
        const resp = await fetch('/api/voice/command-from-audio', { method: 'POST', body: fd })
        const js = await resp.json().catch(() => null)
        if (cancelled) return
        const tr = js && typeof js.transcript === 'string' ? String(js.transcript).trim() : ''
        if (tr) {
          setFeed(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: 'voice:cmd', time: new Date().toLocaleTimeString(), payload: { transcript: tr } }, ...prev].slice(0, 50))
        }
        const reply = js && typeof js.reply === 'string' ? js.reply : 'Okay.'
        setFeed(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: 'voice:reply', time: new Date().toLocaleTimeString(), payload: { reply, raw: js } }, ...prev].slice(0, 50))
        speak(reply)
      } catch {}
    }

    const startLocal = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setVoiceBackend('webspeech')
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          try { stream.getTracks().forEach(t => { try { t.stop() } catch {} }) } catch {}
          return
        }
        streamRef.current = stream

        const AC = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AC) {
          setVoiceBackend('webspeech')
          return
        }
        const ctx = new AC()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyserRef.current = analyser
        source.connect(analyser)
        const data = new Uint8Array(analyser.fftSize)

        const startRec = () => {
          if (recordingRef.current) return
          try {
            chunksRef.current = []
            const mime = (window as any).MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : undefined
            const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
            mediaRecorderRef.current = mr
            recordingRef.current = true
            silenceAtRef.current = null
            mr.ondataavailable = (e: any) => {
              try { if (e && e.data && e.data.size > 0) chunksRef.current.push(e.data) } catch {}
            }
            mr.onstop = async () => {
              try {
                const parts = chunksRef.current
                chunksRef.current = []
                recordingRef.current = false
                if (!parts.length) return
                const blob = new Blob(parts, { type: mime || 'audio/webm' })
                if (blob.size < 1200) return
                await sendAudio(blob)
              } catch {}
            }
            mr.start()
          } catch {
            recordingRef.current = false
          }
        }

        const stopRec = () => {
          if (!recordingRef.current) return
          if (!mediaRecorderRef.current) return
          try { mediaRecorderRef.current.stop() } catch {}
        }

        const tick = () => {
          if (cancelled) return
          try {
            analyser.getByteTimeDomainData(data)
            let sum = 0
            for (let i = 0; i < data.length; i++) {
              const v = (data[i] - 128) / 128
              sum += v * v
            }
            const rms = Math.sqrt(sum / data.length)
            const now = Date.now()
            const speaking = rms > 0.02
            if (speaking) {
              silenceAtRef.current = null
              startRec()
            } else if (recordingRef.current) {
              if (silenceAtRef.current === null) silenceAtRef.current = now
              if (silenceAtRef.current !== null && (now - silenceAtRef.current) > 900) {
                stopRec()
                silenceAtRef.current = null
              }
            }
          } catch {}
          try { rafRef.current = requestAnimationFrame(tick) } catch {}
        }

        try { rafRef.current = requestAnimationFrame(tick) } catch {}
      } catch {
        setVoiceBackend('webspeech')
      }
    }

    if (!voiceOn) {
      if (rec && typeof rec.stop === 'function') { try { rec.stop() } catch {} }
      setRec(null)
      void stopLocal()
      return
    }

    if (voiceBackend === 'local') {
      if (rec && typeof rec.stop === 'function') { try { rec.stop() } catch {} }
      setRec(null)
      void stopLocal().then(() => { if (!cancelled) void startLocal() })
      return () => { cancelled = true; void stopLocal() }
    }

    void stopLocal()

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = 'en-US'
    r.continuous = true
    r.interimResults = false
    r.onresult = async (ev: any) => {
      try {
        const tr = String(ev.results?.[ev.results.length - 1]?.[0]?.transcript || '').toLowerCase().trim()
        if (!tr || tr.length < 2) return
        if (lastVoiceRef.current === tr) return
        lastVoiceRef.current = tr
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
        } else {
          setFeed(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: 'voice:cmd', time: new Date().toLocaleTimeString(), payload: { transcript: tr } }, ...prev].slice(0, 50))
          const resp = await postJson('/api/voice/command', { transcript: tr })
          const js = await resp.json().catch(() => null)
          const reply = js && typeof js.reply === 'string' ? js.reply : 'Okay.'
          setFeed(prev => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: 'voice:reply', time: new Date().toLocaleTimeString(), payload: { reply, raw: js } }, ...prev].slice(0, 50))
          speak(reply)
        }
      } catch {}
    }
    r.onend = () => { try { if (voiceOn && voiceBackend === 'webspeech') r.start() } catch {} }
    try { r.start() } catch {}
    setRec(r)
    return () => { cancelled = true; try { r.onresult = null; r.onend = null; r.stop() } catch {} }
  }, [voiceOn, voiceBackend])

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
            <button onClick={() => setVoiceBackend(b => b === 'local' ? 'webspeech' : 'local')} style={{ background: 'transparent', color: voiceBackend === 'local' ? '#9CCC65' : '#B0BEC5', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginRight: 6 }}>{voiceBackend === 'local' ? 'Local STT' : 'Web STT'}</button>
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Level {prompt.level} Confirmation Required</div>
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

