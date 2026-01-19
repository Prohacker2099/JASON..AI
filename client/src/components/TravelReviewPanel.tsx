import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

type TravelPlan = {
  scenario?: string;
  goal?: string;
  days?: number;
  flights?: any;
  hotels?: any[];
  itinerarySources?: any[];
  activitiesSources?: any[];
};

type Job = {
  id: string;
  goal?: string;
  status?: string;
  flightSummary?: any;
  travelPlan?: TravelPlan;
};

const TravelReviewPanel: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const list = await api.getOrchJobs();
      setJobs(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || 'failed_to_load_jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentJob = useMemo(() => {
    const withPlan = jobs.filter((j) => j.travelPlan && j.travelPlan.scenario === 'cambodia_15d_luxury_budget');
    if (withPlan.length === 0) return null;
    const completed = withPlan.find((j) => j.status === 'completed');
    return completed || withPlan[0];
  }, [jobs]);

  const plan: TravelPlan | null = currentJob?.travelPlan || null;

  const flights = plan?.flights;
  const hotels = plan?.hotels || [];
  const itinerarySources = plan?.itinerarySources || [];
  const activitiesSources = plan?.activitiesSources || [];

  if (loading) {
    return (
      <div style={{ color: '#fff', background: '#0B0F14', minHeight: '100vh', padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
        <div>Loading trip plan</div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div style={{ color: '#fff', background: '#0B0F14', minHeight: '100vh', padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Travel Planner</div>
        <div style={{ marginBottom: 12 }}>No Cambodia 15-day travel plan found.</div>
        {error && <div style={{ color: '#ef5350' }}>Error: {error}</div>}
        <div style={{ marginTop: 16 }}>
          <a href="#/" style={{ color: '#90CAF9' }}>Back to Home</a>
        </div>
      </div>
    );
  }

  const bestFlight = (() => {
    const r = flights && typeof flights === 'object' ? (flights as any) : null;
    if (!r) return null;
    const exec = r.result && typeof r.result === 'object' ? r.result : r;
    if (!exec) return null;
    const best = exec.best || exec;
    return best || null;
  })();

  return (
    <div style={{ color: '#fff', background: '#0B0F14', minHeight: '100vh', padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Cambodia 15-day Trip (Luxury-on-a-Budget)</div>
        <div style={{ opacity: 0.7 }}>
          {currentJob?.status === 'completed' ? (
            <span style={{ color: '#81C784' }}>PLAN READY</span>
          ) : (
            <span style={{ color: '#FFE082' }}>IN PROGRESS</span>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="#/" style={{ color: '#90CAF9' }}>Back to Home</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#11161B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Flight Summary</div>
            {bestFlight ? (
              <div style={{ fontSize: 14 }}>
                <div>From: <strong>{(bestFlight.origin || (bestFlight.meta && bestFlight.meta.origin)) || 'LHR'}</strong></div>
                <div>To: <strong>{(bestFlight.destination || (bestFlight.meta && bestFlight.meta.destination)) || 'PNH'}</strong></div>
                <div style={{ marginTop: 6 }}>
                  Price: <strong>{bestFlight.currency || ''} {bestFlight.price}</strong>{' '}
                  {bestFlight.siteName ? <span>via {bestFlight.siteName}</span> : null}
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No flight options extracted yet. The background agent may still be running or was blocked by a CAPTCHA.</div>
            )}
          </div>

          <div style={{ background: '#11161B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Hotel Ideas (Luxury on a Budget)</div>
            {hotels.length === 0 ? (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No hotel titles captured yet. Try rerunning the planner later.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {hotels.map((h, idx) => {
                  const v = (h && (h as any).result) ? (h as any).result : h;
                  const title = v && typeof v.title === 'string' ? v.title : 'Hotel search result';
                  const url = v && typeof v.url === 'string' ? v.url : undefined;
                  return (
                    <li key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 14 }}>{title}</div>
                      {url && (
                        <div style={{ marginTop: 2 }}>
                          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#90CAF9' }}>Open source</a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div style={{ background: '#11161B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Your Notes / Final Adjustments</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
              Use this space to capture dates, names, and any changes before you actually book. JASON stays in background and never confirms purchases without a Level 3 approval.
            </div>
            <textarea
              style={{ width: '100%', minHeight: 120, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', padding: 8, background: '#020308', color: '#fff', resize: 'vertical' }}
              placeholder="e.g., Lock in Siem Reap 5 nights, Phnom Penh 4 nights, Koh Rong 6 nights. Prioritize pool, spa, and breakfast included."
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#11161B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Itinerary Inspirations</div>
            {itinerarySources.length === 0 ? (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No itinerary pages captured yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {itinerarySources.map((s, idx) => {
                  const v = (s && (s as any).result) ? (s as any).result : s;
                  const title = v && typeof v.title === 'string' ? v.title : 'Itinerary source';
                  const url = v && typeof v.url === 'string' ? v.url : undefined;
                  return (
                    <li key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 14 }}>{title}</div>
                      {url && (
                        <div style={{ marginTop: 2 }}>
                          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#90CAF9' }}>Open source</a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div style={{ background: '#11161B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Activities & Experiences</div>
            {activitiesSources.length === 0 ? (
              <div style={{ opacity: 0.7, fontSize: 13 }}>No activities pages captured yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {activitiesSources.map((s, idx) => {
                  const v = (s && (s as any).result) ? (s as any).result : s;
                  const title = v && typeof v.title === 'string' ? v.title : 'Activities source';
                  const url = v && typeof v.url === 'string' ? v.url : undefined;
                  return (
                    <li key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 14 }}>{title}</div>
                      {url && (
                        <div style={{ marginTop: 2 }}>
                          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#90CAF9' }}>Open source</a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelReviewPanel;
