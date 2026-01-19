import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

type Health = { status: string; uptime: number; timestamp: string };

type FlightSummary = {
  ok: boolean;
  bestPrice?: number | null;
  currency?: string | null;
  siteId?: string | null;
  siteName?: string | null;
  reachedPaymentPage?: boolean;
};

type Job = { id: string; goal?: string; status?: string; flightSummary?: FlightSummary; travelPlan?: any };

function useSSE(url: string, onEvent: (ev: MessageEvent) => void) {
  useEffect(() => {
    const es = new EventSource(url);
    es.onmessage = onEvent;
    es.addEventListener('orch:job', onEvent as any);
    es.addEventListener('aiEvent', onEvent as any);
    es.addEventListener('aiInsight', onEvent as any);
    return () => { es.close(); };
  }, [url, onEvent]);
}

export default function JEyeV2() {
  const [health, setHealth] = useState<Health | null>(null);
  const [context, setContext] = useState<any>(null);
  const [paused, setPaused] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [bdi, setBdi] = useState<any | null>(null);
  const [styleProfile, setStyleProfile] = useState<any | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const statusColor = useMemo(() => {
    if (paused) return '#ff3b30';
    return '#34c759';
  }, [paused]);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => {});
    fetch('/api/context/status').then(r => r.json()).then(setContext).catch(() => {});
    fetch('/api/orch/jobs').then(r => r.json()).then(setJobs).catch(() => {});
    fetch('/api/trust/status').then(r => r.json()).then(d => setPaused(!!d.paused)).catch(() => {});
    (async () => {
      try {
        const logs = await api.getActivityLogs(50);
        const list = (logs as any).logs;
        setActivity(Array.isArray(list) ? list : []);
      } catch {}
      try {
        const status = await api.getBDIStatus();
        setBdi(status);
      } catch {}
      try {
        const ctx = await api.getContextCurrent();
        if (ctx && (ctx as any).state) setContext((ctx as any).state);
      } catch {}
      try {
        const sp = await api.getStyleProfile({ channel: 'email' });
        setStyleProfile((sp as any).profile || sp);
      } catch {}
    })();
  }, []);

  useSSE('/api/events', (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data || '{}');

      if (ev.type === 'orch:job') {
        const payload: any = data;
        const id = String(payload.id || '');
        if (id) {
          setJobs((prev) => {
            const next = [...prev];
            const idx = next.findIndex((j) => j.id === id);
            const existing: Job = idx >= 0 ? next[idx] : { id } as Job;
            const updated: Job = {
              ...existing,
              status: typeof payload.status === 'string' ? payload.status : existing.status,
              goal: typeof payload.goal === 'string' ? payload.goal : existing.goal,
              flightSummary: payload.flightSummary || existing.flightSummary,
              travelPlan: payload.travelPlan || existing.travelPlan,
            };
            if (idx >= 0) next[idx] = updated; else next.unshift(updated);
            return next.slice(0, 16);
          });
        }

        try {
          if (payload && payload.travelPlan && payload.travelPlan.scenario === 'cambodia_15d_luxury_budget' && payload.status === 'completed') {
            if (typeof window !== 'undefined') {
              if (window.location.hash !== '#/travel') {
                window.location.hash = '#/travel';
              }
            }
          }
        } catch {}
      }

      if (feedRef.current) {
        const line = document.createElement('div');
        line.textContent = `[${new Date().toLocaleTimeString()}] ${ev.type || 'event'} ${JSON.stringify(data).slice(0, 200)}`;
        feedRef.current.prepend(line);
        const children = Array.from(feedRef.current.children);
        if (children.length > 100) feedRef.current.removeChild(children[children.length - 1]);
      }
    } catch {}
  });

  const toggleKill = async () => {
    const next = !paused;
    setPaused(next);
    try {
      await fetch('/api/trust/kill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paused: next }) });
    } catch {
      setPaused(!next);
    }
  };

  const setMood = async (mood: string) => {
    try {
      const res = await fetch('/api/context/mood', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood }) });
      const js = await res.json();
      setContext(js.state || js);
    } catch {}
  };

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, width: 360, zIndex: 9999, fontFamily: 'Inter, system-ui' }}>
      <div style={{ background: '#111', color: '#fff', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,0.35)', overflow: 'hidden', border: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #222' }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: statusColor, marginRight: 8 }} />
          <div style={{ fontWeight: 600 }}>J-Eye</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={toggleKill} style={{ background: paused ? '#7a1a16' : '#1b4d2b', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12 }}>
          <div style={{ background: '#0f1320', borderRadius: 8, padding: 10 }}>
            <div style={{ opacity: 0.7, fontSize: 12 }}>Health</div>
            <div style={{ fontSize: 12 }}>{health ? `${health.status} · ${Math.round((health.uptime||0))}s` : '—'}</div>
          </div>
          <div style={{ background: '#0f1320', borderRadius: 8, padding: 10 }}>
            <div style={{ opacity: 0.7, fontSize: 12 }}>Mood</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {['calm','focused','tired','stressed','happy','neutral'].map(m => (
                <button key={m} onClick={() => setMood(m)} style={{ background: '#1d2336', color: '#fff', border: '1px solid #2a3352', borderRadius: 6, padding: '4px 6px', fontSize: 12, cursor: 'pointer' }}>{m}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 6 }}>Jobs</div>
          <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #222', borderRadius: 8, padding: 8 }}>
            {(jobs || []).slice(0, 8).map(j => {
              const fs = j.flightSummary;
              const isFlight = !!fs;
              const isDone = j.status === 'completed' || j.status === 'failed';
              const badgeBg = isFlight ? (fs?.ok ? '#12371f' : '#402016') : '#1d2336';
              const badgeBorder = isFlight ? (fs?.ok ? '#2a7c3a' : '#7a2b23') : '#2a3352';
              return (
                <div key={j.id} style={{ fontSize: 12, opacity: 0.9, padding: '4px 0', borderBottom: '1px dashed #222' }}>
                  <div>#{j.id.slice(0, 6)} {j.status || 'unknown'}</div>
                  {j.goal ? <div style={{ opacity: 0.7 }}>{j.goal}</div> : null}
                  {isFlight && isDone && (
                    <div style={{ marginTop: 4, fontSize: 11, background: badgeBg, borderRadius: 6, padding: '4px 6px', border: `1px solid ${badgeBorder}` }}>
                      <div style={{ opacity: 0.8 }}>Flight arbitrage</div>
                      {fs?.bestPrice != null && (
                        <div>
                          Best: {fs.currency || ''} {fs.bestPrice?.toFixed ? fs.bestPrice.toFixed(0) : fs.bestPrice} {fs.siteName ? ` · ${fs.siteName}` : ''}
                        </div>
                      )}
                      <div style={{ opacity: 0.8 }}>
                        Payment page: {fs?.reachedPaymentPage ? 'reached (no pay)' : 'not reached'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {(!jobs || jobs.length === 0) && <div style={{ fontSize: 12, opacity: 0.6 }}>No jobs</div>}
          </div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 6 }}>BDI / Beliefs</div>
          <div style={{ background: '#0f1320', borderRadius: 8, padding: 10, fontSize: 12 }}>
            {bdi && (bdi as any).beliefs ? (
              <>
                <div>Mood: {(bdi as any).beliefs.mood || 'unknown'}</div>
                <div>Safety: {(bdi as any).beliefs.safety?.severity || 'n/a'}</div>
                <div>Desires: {Array.isArray((bdi as any).recentDesires) ? (bdi as any).recentDesires.length : 0}</div>
              </>
            ) : (
              <div style={{ opacity: 0.7 }}>Belief state unavailable.</div>
            )}
          </div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 6 }}>Style Profile</div>
          <div style={{ background: '#0f1320', borderRadius: 8, padding: 10, fontSize: 12 }}>
            {styleProfile ? (
              <>
                <div>Formality: {(styleProfile as any).formalityLevel || 'unknown'}</div>
                <div>Format: {(styleProfile as any).formatSchema || 'plain'}</div>
              </>
            ) : (
              <div style={{ opacity: 0.7 }}>Style profile unavailable.</div>
            )}
          </div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 6 }}>Activity</div>
          <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #222', borderRadius: 8, padding: 8, fontSize: 12, lineHeight: 1.4 }}>
            {activity && activity.length > 0 ? (
              activity.map((log: any) => (
                <div key={log.id || `${log.event}_${log.timestamp}`} style={{ marginBottom: 6 }}>
                  <div style={{ opacity: 0.8 }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''} · {log.event}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {(() => {
                      const d = log.data || {};
                      if (typeof d === 'string') return d;
                      try {
                        return JSON.stringify(d);
                      } catch {
                        return String(d);
                      }
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <div ref={feedRef} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
