import { publishAppContext } from '../bus/Percepts'

class AppFocusWatcher {
  private timer: NodeJS.Timeout | null = null
  private lastPid: number | null = null
  private mod: any | null = null
  private ensure() {
    if (this.mod !== null) return
    try {
      const mod = require('active-win')
      this.mod = mod?.default || mod
    } catch {
      this.mod = undefined
    }
  }
  private classify(exe?: string, title?: string): 'game' | 'editor' | 'browser' | 'system' | 'unknown' {
    const s = `${exe || ''} ${title || ''}`.toLowerCase()
    if (/chrome|edge|firefox|brave|safari|msedge/.test(s)) return 'browser'
    if (/code|vscode|idea|sublime|notepad\+\+|notepad|vim|emacs|intellij/.test(s)) return 'editor'
    if (/steam|game|unity|unreal|epicgames|valorant|league|dota|minecraft|roblox/.test(s)) return 'game'
    if (/taskmgr|explorer|systemsettings|control panel|settings|system/.test(s)) return 'system'
    return 'unknown'
  }
  start(intervalMs = 2000) {
    if (this.timer) return
    this.ensure()
    const iv = Math.max(500, Math.min(10000, Number(intervalMs)))
    this.timer = setInterval(async () => {
      try {
        if (!this.mod) return
        const info = await this.mod()
        if (!info) return
        const pid: number | undefined = info?.owner?.processId || info?.pid
        const exe: string | undefined = info?.owner?.name || info?.owner?.path || info?.app || info?.title
        const title: string | undefined = info?.title
        const changed = pid && pid !== this.lastPid
        if (changed) this.lastPid = pid || null
        const classification = this.classify(exe, title)
        publishAppContext({
          event: changed ? 'foreground_changed' : 'foreground_changed',
          app: { name: exe, pid, windowTitle: title, path: info?.owner?.path, classification },
          focus: true,
          fullscreen: false,
          category: classification === 'browser' || classification === 'editor' ? 'work' : classification === 'game' ? 'distraction' : classification === 'system' ? 'system' : 'unknown',
        })
      } catch {}
    }, iv)
  }
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null } }
}

export const appFocusWatcher = new AppFocusWatcher()
