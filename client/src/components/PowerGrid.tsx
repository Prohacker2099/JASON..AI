import React, { useEffect, useMemo, useState } from 'react';
import { api, PowerDevice } from '../api';
import { useSSE } from '../hooks/useSSE';

export const PowerGrid: React.FC = () => {
  const [devices, setDevices] = useState<PowerDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const r = await api.listPowerDevices();
      setDevices(r.devices);
    } catch (e: any) {
      setError(e?.message || 'failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  useSSE(
    {
      'device:update': (e) => {
        try {
          const payload = JSON.parse(e.data);
          const { deviceId, state } = payload || {};
          setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, state: { ...d.state, ...state } } : d)));
        } catch {}
      },
      'energy:action': () => refresh(),
    },
    undefined
  );

  const zones = useMemo(() => {
    const m = new Map<string, PowerDevice[]>();
    for (const d of devices) {
      const z = d.zone || 'default';
      if (!m.has(z)) m.set(z, []);
      m.get(z)!.push(d);
    }
    return Array.from(m.entries());
  }, [devices]);

  const onToggle = async (id: string) => {
    await api.toggleSocket(id);
    await refresh();
  };

  const onBrightness = async (id: string, value: number) => {
    await api.setLightBrightness(id, value);
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, state: { ...d.state, brightness: value } } : d)));
  };

  if (loading) return <div>Loading power grid…</div>;
  if (error) return <div style={{ color: 'tomato' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      {zones.map(([zone, list]) => (
        <div key={zone} style={{ border: '1px solid #2c2c2c', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>{zone}</h3>
          {list.map((d) => (
            <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{d.type}</div>
                </div>
                {d.type.includes('plug') ? (
                  <button onClick={() => onToggle(d.id)}>Toggle</button>
                ) : null}
              </div>
              {d.type.includes('light') ? (
                <div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={typeof d.state?.brightness === 'number' ? d.state.brightness : 100}
                    onChange={(e) => onBrightness(d.id, Number(e.target.value))}
                  />
                  <div style={{ fontSize: 12 }}>Brightness: {typeof d.state?.brightness === 'number' ? d.state.brightness : 100}%</div>
                </div>
              ) : null}
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Power: {d.state?.power ?? 'n/a'} | Last Active: {d.state?.lastActive ?? d.state?.lastSeen ?? 'n/a'}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
