import React, { useEffect, useMemo, useState } from 'react'

async function getJson<T = any>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}
async function postJson<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

const Row: React.FC<{ label: string; children: React.ReactNode }>
  = ({ label, children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
    <div style={{ width: 240, fontWeight: 600 }}>{label}</div>
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

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }>
  = ({ checked, onChange }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span>{checked ? 'On' : 'Off'}</span>
  </label>
)

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{ ...(props.style||{}), background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '6px 8px' }} />
)

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
  <button {...rest} style={{ ...(rest.style||{}), background: '#1F2A34', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>{children}</button>
)

const Pre: React.FC<{ data: any; maxHeight?: number }> = ({ data, maxHeight = 200 }) => (
  <div style={{ maxHeight, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{(() => { try { return JSON.stringify(data, null, 2) } catch { return String(data) } })()}</pre>
  </div>
)

const EthicsPanel: React.FC = () => {
  const [ethicsCfg, setEthicsCfg] = useState<any>(null)
  const [daiCfg, setDaiCfg] = useState<any>(null)
  const [audits, setAudits] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [scanText, setScanText] = useState<string>('')
  const [scanResult, setScanResult] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [e, d, a, r] = await Promise.all([
        getJson('/api/ethics/status'),
        getJson('/api/dai/config'),
        getJson('/api/ethics/audit?limit=50'),
        getJson('/api/scrl/reviews?limit=50'),
      ])
      setEthicsCfg(e); setDaiCfg(d); setAudits(a); setReviews(r)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const saveEthics = async () => {
    await postJson('/api/ethics/config', ethicsCfg)
    await loadAll()
  }
  const saveDAI = async () => {
    await postJson('/api/dai/config', { overrideCapUSD: daiCfg?.overrideCapUSD ?? null })
    await loadAll()
  }
  const runScan = async () => {
    const out = await postJson('/api/ethics/scan', { text: scanText })
    setScanResult(out?.scan)
  }

  return (
    <div style={{ color: '#fff', background: '#0B0F14', minHeight: '100vh', padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Ethical Dashboard</div>
        <div style={{ opacity: 0.7 }}>{loading ? 'Loading…' : ''}</div>
        <div style={{ marginLeft: 'auto' }}>
          <Btn onClick={loadAll}>Refresh</Btn>
          <a href="#/" style={{ marginLeft: 12, color: '#90CAF9' }}>Home</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Morality Engine Config">
          {!ethicsCfg ? <div>Loading…</div> : (
            <div>
              <Row label="Ethical Mode"><Toggle checked={!!ethicsCfg.ethicalMode} onChange={v => setEthicsCfg({ ...ethicsCfg, ethicalMode: v })} /></Row>
              <Row label="Block Hate Speech"><Toggle checked={!!ethicsCfg.blockHateSpeech} onChange={v => setEthicsCfg({ ...ethicsCfg, blockHateSpeech: v })} /></Row>
              <Row label="Block Harassment"><Toggle checked={!!ethicsCfg.blockHarassment} onChange={v => setEthicsCfg({ ...ethicsCfg, blockHarassment: v })} /></Row>
              <Row label="Block Manipulation"><Toggle checked={!!ethicsCfg.blockManipulation} onChange={v => setEthicsCfg({ ...ethicsCfg, blockManipulation: v })} /></Row>
              <Row label="Require Consent (Sensitive)"><Toggle checked={!!ethicsCfg.requireConsentForSensitive} onChange={v => setEthicsCfg({ ...ethicsCfg, requireConsentForSensitive: v })} /></Row>
              <Row label={`Risk Prompt Threshold: ${Number(ethicsCfg.riskPromptThreshold ?? 0.5).toFixed(2)}`}>
                <input type="range" min={0} max={1} step={0.01} value={Number(ethicsCfg.riskPromptThreshold ?? 0.5)} onChange={e => setEthicsCfg({ ...ethicsCfg, riskPromptThreshold: Number(e.target.value) })} />
              </Row>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={saveEthics}>Save Config</Btn>
              </div>
            </div>
          )}
        </Card>

        <Card title="DAI Guardrails (Spending Cap)">
          {!daiCfg ? <div>Loading…</div> : (
            <div>
              <Row label="Env Cap (read-only)"><div>${'{'}daiCfg.envCapUSD{'}'}</div></Row>
              <Row label="Override Cap (USD)">
                <Input type="number" placeholder="e.g., 50" value={daiCfg.overrideCapUSD ?? ''} onChange={e => setDaiCfg({ ...daiCfg, overrideCapUSD: e.target.value === '' ? null : Number(e.target.value) })} />
              </Row>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={saveDAI}>Save Cap</Btn>
                <Btn onClick={() => { setDaiCfg({ ...daiCfg, overrideCapUSD: null }); }}>Clear Override</Btn>
              </div>
            </div>
          )}
        </Card>

        <Card title="Ethics Text Scanner">
          <Row label="Text">
            <Input placeholder="Type text to scan…" value={scanText} onChange={e => setScanText(e.target.value)} />
          </Row>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={runScan}>Scan</Btn>
          </div>
          {scanResult && (
            <div style={{ marginTop: 12 }}>
              <Pre data={scanResult} />
            </div>
          )}
        </Card>

        <Card title="Recent Ethics Audits">
          {audits && audits.length > 0 ? (
            <Pre data={audits} />
          ) : <div>No audits yet.</div>}
        </Card>

        <Card title="Recent SCRL Reviews">
          {reviews && reviews.length > 0 ? (
            <Pre data={reviews} />
          ) : <div>No reviews yet.</div>}
        </Card>
      </div>
    </div>
  )
}

export default EthicsPanel
