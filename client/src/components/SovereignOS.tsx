import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type OrchestratorJob = {
  id: string
  goal?: string
  status?: string
  waitingForPromptId?: string
  flightSummary?: {
    ok: boolean
    bestPrice?: number | null
    currency?: string | null
    siteId?: string | null
    siteName?: string | null
    reachedPaymentPage?: boolean
    offersCount?: number
  }
  travelPlan?: any
}

type TrustPrompt = {
  id: string
  level: 1 | 2 | 3
  title: string
  rationale?: string
  options: Array<'approve' | 'reject' | 'delay'>
  createdAt: number
  meta?: any
}

type FeedItem = { id: string; type: string; time: string; payload: any }

type HandsStatus = {
  ok: boolean
  status?: { started: boolean; headless: boolean; startedAt: number | null; url: string; title: string }
  error?: string
}

type OrchJobDetails = any

async function getJson<T = any>(url: string): Promise<T> {
  const r = await fetch(url)
  const t = await r.text()
  let j: any
  try {
    j = JSON.parse(t)
  } catch {
    j = { raw: t }
  }
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j)}`)
  return j
}

async function postJson<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
  const t = await r.text()
  let j: any
  try {
    j = JSON.parse(t)
  } catch {
    j = { raw: t }
  }
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j)}`)
  return j
}

const Pill: React.FC<{ label: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }> = ({ label, tone = 'neutral' }) => {
  const colors: Record<string, string> = {
    good: 'rgba(16,185,129,0.18)',
    warn: 'rgba(245,158,11,0.18)',
    bad: 'rgba(239,68,68,0.18)',
    neutral: 'rgba(148,163,184,0.12)',
  }
  const borders: Record<string, string> = {
    good: 'rgba(16,185,129,0.35)',
    warn: 'rgba(245,158,11,0.35)',
    bad: 'rgba(239,68,68,0.35)',
    neutral: 'rgba(148,163,184,0.22)',
  }
  return (
    <span
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${borders[tone]}`,
        background: colors[tone],
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  )
}

const Card: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, right, children }) => (
  <div
    style={{
      background: 'rgba(2,6,23,0.72)',
      border: '1px solid rgba(148,163,184,0.18)',
      borderRadius: 18,
      padding: 16,
      boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(226,232,240,0.9)' }}>
        {title}
      </div>
      {right}
    </div>
    {children}
  </div>
)

const SovereignOS: React.FC = () => {
  const [goal, setGoal] = useState('')
  const [priority, setPriority] = useState<number>(3)
  const [simulate, setSimulate] = useState<boolean>(false)
  const [allowUI, setAllowUI] = useState<boolean>(true)
  const [allowNetwork, setAllowNetwork] = useState<boolean>(true)
  const [allowProcess, setAllowProcess] = useState<boolean>(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [submitAck, setSubmitAck] = useState<any>(null)

  const [jobs, setJobs] = useState<OrchestratorJob[]>([])
  const [trustPaused, setTrustPaused] = useState<boolean>(false)
  const [trustPrompts, setTrustPrompts] = useState<TrustPrompt[]>([])

  const [feed, setFeed] = useState<FeedItem[]>([])

  const [handsStatus, setHandsStatus] = useState<HandsStatus | null>(null)

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const [jobDetailsById, setJobDetailsById] = useState<Record<string, OrchJobDetails>>({})

  const esRef = useRef<EventSource | null>(null)

  const addFeed = useCallback((type: string, payload: any) => {
    setFeed((prev) => [{ id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type, time: new Date().toLocaleTimeString(), payload }, ...prev].slice(0, 60))
  }, [])

  const refreshOrchestrator = useCallback(async () => {
    const out = await getJson<OrchestratorJob[]>('/api/orch/jobs')
    setJobs(Array.isArray(out) ? out : [])
  }, [])

  const resumeOrchestratorJob = useCallback(async (promptId: string) => {
    try {
      await postJson(`/api/orchestrator/interact/${encodeURIComponent(promptId)}`, { response: 'approve' })
      await refreshOrchestrator()
    } catch {
    }
  }, [refreshOrchestrator])

  const cancelOrchestratorJob = useCallback(async (jobId: string) => {
    try {
      await postJson(`/api/orchestrator/cancel/${encodeURIComponent(jobId)}`, {})
      await refreshOrchestrator()
    } catch {
    }
  }, [refreshOrchestrator])

  const refreshTrust = useCallback(async () => {
    const st = await getJson<{ paused: boolean }>('/api/trust/status')
    const pend = await getJson<{ prompts: TrustPrompt[]; paused: boolean }>('/api/trust/pending')
    setTrustPaused(!!(pend && typeof pend.paused === 'boolean' ? pend.paused : st?.paused))
    setTrustPrompts(Array.isArray(pend?.prompts) ? pend.prompts : [])
  }, [])

  const refreshHands = useCallback(async () => {
    const st = await getJson<HandsStatus>('/api/hands/browser/status')
    setHandsStatus(st)
  }, [])

  useEffect(() => {
    let active = true
    const boot = async () => {
      try {
        await Promise.all([refreshOrchestrator(), refreshTrust(), refreshHands()])
      } catch {
      } finally {
        if (!active) return
      }
    }
    void boot()
    const t1 = setInterval(() => {
      void refreshOrchestrator().catch(() => {})
    }, 2000)
    const t2 = setInterval(() => {
      void refreshTrust().catch(() => {})
    }, 2000)
    const t3 = setInterval(() => {
      void refreshHands().catch(() => {})
    }, 4000)
    return () => {
      active = false
      clearInterval(t1)
      clearInterval(t2)
      clearInterval(t3)
    }
  }, [refreshHands, refreshOrchestrator, refreshTrust])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ES = (window as any).EventSource
    if (!ES) return
    if (esRef.current) return

    const es = new ES('/api/events') as EventSource

    const onAny = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        addFeed(ev.type, data)
      } catch {
      }
    }

    const onPrompt = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        addFeed('trust:prompt', data)
      } catch {
      }
    }

    const onDecision = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        addFeed('trust:decision', data)
      } catch {
      }
    }

    const names = ['ai:self:event', 'ai:self:trained', 'energy:reading', 'energy:optimized', 'orch:job', 'hands:loop']
    for (const n of names) es.addEventListener(n, onAny)
    es.addEventListener('trust:prompt', onPrompt)
    es.addEventListener('trust:decision', onDecision)
    es.addEventListener('trust:kill', onAny)

    esRef.current = es

    return () => {
      try {
        es.close()
      } catch {
      }
      esRef.current = null
    }
  }, [addFeed])

  const submitGoal = useCallback(async () => {
    const text = goal.trim()
    if (!text || submitting) return

    setSubmitting(true)
    setSubmitError('')
    setSubmitAck(null)

    try {
      const sandbox = {
        allowUI,
        allowNetwork,
        allowProcess,
        allowPowershell: false,
        allowApp: true,
      }

      const out = await postJson('/action/submit_goal', {
        natural_language_goal: text,
        priority,
        simulate,
        sandbox,
      })
      setSubmitAck(out)
      setGoal('')
    } catch (e: any) {
      setSubmitError(e?.message || String(e))
    } finally {
      setSubmitting(false)
    }
  }, [allowNetwork, allowProcess, allowUI, goal, priority, simulate, submitting])

  const toggleJobDetails = useCallback(async (id: string) => {
    setExpandedJobId((prev) => (prev === id ? null : id))
    if (jobDetailsById[id]) return
    try {
      const details = await getJson<OrchJobDetails>(`/api/orchestrator/jobs/${encodeURIComponent(id)}`)
      setJobDetailsById((prev) => ({ ...prev, [id]: details }))
    } catch {
    }
  }, [jobDetailsById])

  const decidePrompt = useCallback(async (id: string, decision: 'approve' | 'reject' | 'delay') => {
    try {
      await postJson('/api/trust/decide', { id, decision })
      await refreshTrust()
    } catch {
    }
  }, [refreshTrust])

  const toggleKill = useCallback(async () => {
    try {
      await postJson('/api/trust/kill', { paused: !trustPaused })
      await refreshTrust()
    } catch {
    }
  }, [refreshTrust, trustPaused])

  const primaryStatus = useMemo(() => {
    if (trustPaused) return { label: 'KILL-SWITCH: PAUSED', tone: 'warn' as const }
    if (trustPrompts.length) return { label: `APPROVALS: ${trustPrompts.length}`, tone: 'warn' as const }
    return { label: 'SOVEREIGN MODE: ARMED', tone: 'good' as const }
  }, [trustPaused, trustPrompts.length])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.14) 0%, transparent 40%), linear-gradient(180deg, #020617 0%, #000 100%)',
        color: '#fff',
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        padding: 18,
      }}
    >
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(147,197,253,0.95)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              JASON
            </div>
            <div style={{ fontSize: 28, fontWeight: 1000, lineHeight: 1.1 }}>The Sovereign Life-Management OS</div>
            <div style={{ marginTop: 8, color: 'rgba(226,232,240,0.75)', maxWidth: 780, fontSize: 13, lineHeight: 1.45 }}>
              Universal Action Model (UAM): execute in the real world via pixels (Eye) and signals (Hand). No subscriptions. No walled gardens.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Pill label={primaryStatus.label} tone={primaryStatus.tone} />
            <Pill label={handsStatus?.status?.started ? `HAND: ${handsStatus.status.headless ? 'HEADLESS' : 'HEADED'}` : 'HAND: OFF'} tone={handsStatus?.status?.started ? 'good' : 'neutral'} />
            <Pill label={`JOBS: ${jobs.length}`} tone={jobs.length ? 'warn' : 'neutral'} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <a href="#/" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 800 }}>Home</a>
          <a href="#/hands" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 800 }}>Hands</a>
          <a href="#/travel" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 800 }}>Travel</a>
          <a href="#/ai" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 800 }}>Self-Learning</a>
          <a href="#/ethics" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 800 }}>Ethics</a>
          <a href="#/conscious" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 800 }}>Conscious</a>
          <a href="#/dev" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 800 }}>Dev</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 14, marginTop: 16 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <Card title="Command (UAM)">
              <div style={{ display: 'grid', gap: 10 }}>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe what you want done: travel, homework, inbox, planning, system actions..."
                  style={{
                    width: '100%',
                    minHeight: 96,
                    resize: 'vertical',
                    background: 'rgba(15,23,42,0.7)',
                    border: '1px solid rgba(148,163,184,0.25)',
                    borderRadius: 14,
                    padding: 12,
                    color: '#fff',
                    outline: 'none',
                    fontSize: 14,
                    lineHeight: 1.35,
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.7)', marginBottom: 6, fontWeight: 800 }}>Priority</div>
                    <select
                      value={String(priority)}
                      onChange={(e) => setPriority(Number(e.target.value || 3))}
                      style={{
                        width: '100%',
                        background: 'rgba(15,23,42,0.7)',
                        border: '1px solid rgba(148,163,184,0.25)',
                        borderRadius: 12,
                        padding: '10px 12px',
                        color: '#fff',
                      }}
                    >
                      <option value="1">1 (low)</option>
                      <option value="3">3 (normal)</option>
                      <option value="5">5 (high)</option>
                      <option value="8">8 (critical)</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, fontWeight: 800 }}>
                    <input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} />
                    Simulate
                  </label>

                  <button
                    onClick={submitGoal}
                    disabled={submitting || !goal.trim()}
                    style={{
                      background: submitting ? 'rgba(37,99,235,0.5)' : '#2563eb',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: '#fff',
                      fontWeight: 1000,
                      cursor: submitting || !goal.trim() ? 'not-allowed' : 'pointer',
                      marginTop: 18,
                    }}
                  >
                    {submitting ? 'SUBMITTING…' : 'EXECUTE'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 13 }}>
                    <input type="checkbox" checked={allowUI} onChange={(e) => setAllowUI(e.target.checked)} />
                    Allow UI
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 13 }}>
                    <input type="checkbox" checked={allowNetwork} onChange={(e) => setAllowNetwork(e.target.checked)} />
                    Allow Network
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 13 }}>
                    <input type="checkbox" checked={allowProcess} onChange={(e) => setAllowProcess(e.target.checked)} />
                    Allow Process
                  </label>
                </div>

                {submitError ? (
                  <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', padding: 12, borderRadius: 14, fontSize: 12 }}>
                    {submitError}
                  </div>
                ) : null}

                {submitAck ? (
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', padding: 12, borderRadius: 14, fontSize: 12 }}>
                    Accepted: {typeof submitAck?.jobId === 'string' ? submitAck.jobId : JSON.stringify(submitAck)}
                  </div>
                ) : null}
              </div>
            </Card>

            <Card title="Orchestrator">
              <div style={{ display: 'grid', gap: 10 }}>
                {jobs.length ? (
                  jobs.map((j) => (
                    <div key={j.id} style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.55)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ fontWeight: 1000, fontSize: 13 }}>{j.goal || j.id}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {j.status === 'waiting_for_user' && j.waitingForPromptId ? (
                            <>
                              <button
                                onClick={() => resumeOrchestratorJob(j.waitingForPromptId as string)}
                                style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 10, padding: '6px 10px', color: '#fff', fontWeight: 1000, cursor: 'pointer' }}
                              >
                                RESUME
                              </button>
                              <button
                                onClick={() => cancelOrchestratorJob(j.id)}
                                style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '6px 10px', color: '#fff', fontWeight: 1000, cursor: 'pointer' }}
                              >
                                CANCEL
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => toggleJobDetails(j.id)}
                            style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 10, padding: '6px 10px', color: '#fff', fontWeight: 1000, cursor: 'pointer' }}
                          >
                            {expandedJobId === j.id ? 'HIDE' : 'DETAILS'}
                          </button>
                          <Pill label={(j.status || 'unknown').toUpperCase()} tone={j.status === 'completed' ? 'good' : j.status === 'failed' ? 'bad' : 'neutral'} />
                        </div>
                      </div>
                      {j.flightSummary ? (
                        <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(2,6,23,0.55)' }}>
                          <div style={{ fontWeight: 1000, fontSize: 12, color: 'rgba(226,232,240,0.9)' }}>Flight Summary</div>
                          <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(226,232,240,0.75)', display: 'grid', gap: 4 }}>
                            <div>Best: <span style={{ color: '#fff', fontWeight: 1000 }}>{typeof j.flightSummary?.bestPrice === 'number' ? `${j.flightSummary.bestPrice} ${j.flightSummary.currency || ''}` : 'n/a (links fallback)'}</span></div>
                            <div>Site: <span style={{ color: '#fff', fontWeight: 1000 }}>{j.flightSummary?.siteName || j.flightSummary?.siteId || 'n/a'}</span></div>
                            <div>Offers: <span style={{ color: '#fff', fontWeight: 1000 }}>{typeof j.flightSummary?.offersCount === 'number' ? String(j.flightSummary.offersCount) : 'n/a'}</span></div>
                            <div>Reached payment: <span style={{ color: '#fff', fontWeight: 1000 }}>{String(!!j.flightSummary?.reachedPaymentPage)}</span></div>
                          </div>
                        </div>
                      ) : null}
                      {j.travelPlan ? (
                        <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(2,6,23,0.55)' }}>
                          <div style={{ fontWeight: 1000, fontSize: 12, color: 'rgba(226,232,240,0.9)' }}>Travel Plan</div>
                          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(226,232,240,0.75)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(j.travelPlan)}</div>
                        </div>
                      ) : null}

                      {expandedJobId === j.id ? (() => {
                        const details = jobDetailsById[j.id]
                        const results = details?.result?.results
                        const flightResult = Array.isArray(results) ? results.find((r: any) => r && r.result && Array.isArray(r.result.offers)) : null
                        const offers: any[] = flightResult?.result?.offers || []
                        return (
                          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(2,6,23,0.55)' }}>
                            <div style={{ fontWeight: 1000, fontSize: 12, color: 'rgba(226,232,240,0.9)' }}>Job Details</div>
                            {offers.length ? (
                              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                                <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.75)' }}>Flight provider links:</div>
                                {offers.map((o: any) => (
                                  <a
                                    key={String(o?.providerId || o?.url || Math.random())}
                                    href={String(o?.url || '#')}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: '#93c5fd', fontWeight: 900, textDecoration: 'none', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title={String(o?.url || '')}
                                  >
                                    {String(o?.providerName || o?.providerId || 'offer')} — {String(o?.url || '')}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(226,232,240,0.7)' }}>
                                {details ? 'No offers found in job results.' : 'Loading details…'}
                              </div>
                            )}
                          </div>
                        )
                      })() : null}
                      <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(226,232,240,0.7)' }}>id: {j.id}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(226,232,240,0.7)', fontSize: 13 }}>No active jobs.</div>
                )}
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <Card
              title="Trust Gate"
              right={
                <button
                  onClick={toggleKill}
                  style={{
                    background: trustPaused ? '#16a34a' : '#b45309',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 12px',
                    color: '#fff',
                    fontWeight: 1000,
                    cursor: 'pointer',
                  }}
                >
                  {trustPaused ? 'RESUME' : 'PAUSE'}
                </button>
              }
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {trustPrompts.length ? (
                  trustPrompts.map((p) => (
                    <div key={p.id} style={{ padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.55)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontWeight: 1000, fontSize: 13 }}>{p.title}</div>
                        <Pill label={`L${p.level}`} tone={p.level === 3 ? 'bad' : p.level === 2 ? 'warn' : 'neutral'} />
                      </div>
                      {p.rationale ? (
                        <div style={{ marginTop: 8, color: 'rgba(226,232,240,0.72)', fontSize: 12, lineHeight: 1.35 }}>{p.rationale}</div>
                      ) : null}
                      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => decidePrompt(p.id, 'approve')} style={{ background: '#16a34a', border: 'none', borderRadius: 10, padding: '8px 10px', color: '#fff', fontWeight: 1000, cursor: 'pointer' }}>APPROVE</button>
                        <button onClick={() => decidePrompt(p.id, 'reject')} style={{ background: '#dc2626', border: 'none', borderRadius: 10, padding: '8px 10px', color: '#fff', fontWeight: 1000, cursor: 'pointer' }}>REJECT</button>
                        <button onClick={() => decidePrompt(p.id, 'delay')} style={{ background: '#334155', border: 'none', borderRadius: 10, padding: '8px 10px', color: '#fff', fontWeight: 1000, cursor: 'pointer' }}>DELAY</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(226,232,240,0.7)', fontSize: 13 }}>No approvals pending.</div>
                )}
              </div>
            </Card>

            <Card title="Eye (Event Feed)">
              <div style={{ maxHeight: 420, overflow: 'auto', borderRadius: 14, border: '1px solid rgba(148,163,184,0.18)' }}>
                {feed.length ? (
                  feed.map((f) => (
                    <div key={f.id} style={{ padding: 10, borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ fontWeight: 1000, fontSize: 12 }}>{f.type}</div>
                        <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.65)' }}>{f.time}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(226,232,240,0.75)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(f.payload)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 12, color: 'rgba(226,232,240,0.7)', fontSize: 13 }}>Waiting for events from /api/events…</div>
                )}
              </div>
            </Card>

            <Card title="Hand (Quick Status)" right={<a href="#/hands" style={{ color: '#93c5fd', fontWeight: 900, textDecoration: 'none' }}>OPEN</a>}>
              <div style={{ display: 'grid', gap: 8, fontSize: 13, color: 'rgba(226,232,240,0.78)' }}>
                <div>Started: <span style={{ color: '#fff', fontWeight: 900 }}>{String(handsStatus?.status?.started ?? false)}</span></div>
                <div>Headless: <span style={{ color: '#fff', fontWeight: 900 }}>{String(handsStatus?.status?.headless ?? false)}</span></div>
                <div>URL: <span style={{ color: '#fff', fontWeight: 900 }}>{handsStatus?.status?.url || ''}</span></div>
                <div>Title: <span style={{ color: '#fff', fontWeight: 900 }}>{handsStatus?.status?.title || ''}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SovereignOS
