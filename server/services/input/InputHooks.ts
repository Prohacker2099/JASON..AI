import { publishUserInput } from '../bus/Percepts'

class InputHooks {
  private ih: any | null = null
  private started = false
  start() {
    if (this.started) return
    try {
      const mod = require('iohook')
      this.ih = mod && mod.default ? mod.default : mod
    } catch {
      this.ih = null
    }
    if (!this.ih) return
    this.started = true
    try {
      this.ih.on('keydown', (e: any) => {
        try {
          const norm = typeof e?.keychar === 'string' ? e.keychar : `key_${e?.keycode ?? 'unknown'}`
          publishUserInput({ modality: 'keyboard', normalized: String(norm), rawHint: String(e?.rawcode ?? ''), isSystemKey: !!e?.altKey || !!e?.ctrlKey || !!e?.shiftKey })
        } catch {}
      })
      this.ih.start()
    } catch {}
  }
  stop() {
    if (!this.started) return
    try { this.ih?.stop() } catch {}
    this.started = false
  }
}

export const inputHooks = new InputHooks()
