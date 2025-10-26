import React, { useEffect, useMemo, useState } from 'react';

// Collect and eagerly import most client source files so they are included in the bundle
// This helps ensure the files are "used" by the app at build/runtime.
// Temporarily limit imports to known-good modules while we rebuild others
const modules = import.meta.glob([
  './App.tsx',
], { eager: true });

type EventItem = { time: string; event: string; data: any };

const DevGallery: React.FC = () => {
  const manifest = useMemo(() => {
    const keys = Object.keys(modules).sort();
    const categorized: Record<string, string[]> = {};
    for (const k of keys) {
      const top = k.split('/')[2] || 'root';
      if (!categorized[top]) categorized[top] = [];
      categorized[top].push(k);
    }
    return categorized;
  }, []);

  const [events, setEvents] = useState<EventItem[]>([]);
  useEffect(() => {
    const es = new EventSource('http://localhost:3001/api/events');
    const push = (evt: MessageEvent, name: string) => {
      try {
        const data = JSON.parse(evt.data);
        setEvents(prev => [{ time: new Date().toLocaleTimeString(), event: name, data }, ...prev].slice(0, 20));
      } catch {
        setEvents(prev => [{ time: new Date().toLocaleTimeString(), event: name, data: evt.data }, ...prev].slice(0, 20));
      }
    };
    es.addEventListener('hello', (e) => push(e as MessageEvent, 'hello'));
    es.addEventListener('aiInsight', (e) => push(e as MessageEvent, 'aiInsight'));
    es.addEventListener('aiEvent', (e) => push(e as MessageEvent, 'aiEvent'));
    es.addEventListener('deviceStateChange', (e) => push(e as MessageEvent, 'deviceStateChange'));
    es.onerror = () => {/* ignore */};
    return () => es.close();
  }, []);

  return (
    <div style={{ padding: '1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1>Developer Gallery</h1>
      <p>Imported {Object.keys(modules).length} modules using import.meta.glob (eager).</p>
      <p>Navigate back to main app: <a href="#/">Home</a></p>
      <hr />
      <h2>Realtime Events (SSE)</h2>
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {events.map((e, i) => (
          <li key={i} style={{ fontSize: '0.9rem' }}>
            <code>[{e.time}] {e.event}</code> — <pre style={{ display: 'inline' }}>{JSON.stringify(e.data)}</pre>
          </li>
        ))}
      </ul>
      <hr />
      {Object.entries(manifest).map(([section, files]) => (
        <div key={section} style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0.5rem 0' }}>{section}</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {files.map((f) => (
              <li key={f} style={{ fontSize: '0.9rem' }}>{f}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default DevGallery;
