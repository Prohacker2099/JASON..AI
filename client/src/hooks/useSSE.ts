import { useEffect, useRef } from 'react';
import { api } from '../api';

type Handler = (event: MessageEvent) => void;

export function useSSE(eventHandlers?: Record<string, Handler>, onAny?: Handler) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = api.eventsUrl();
    const es = new EventSource(url);
    esRef.current = es;

    const anyHandler = (e: MessageEvent) => onAny?.(e);
    es.addEventListener('message', anyHandler);

    if (eventHandlers) {
      for (const [evt, handler] of Object.entries(eventHandlers)) {
        es.addEventListener(evt, handler);
      }
    }

    return () => {
      if (eventHandlers) {
        for (const [evt, handler] of Object.entries(eventHandlers)) {
          es.removeEventListener(evt, handler);
        }
      }
      es.removeEventListener('message', anyHandler);
      es.close();
    };
  }, []);

  return esRef;
}
