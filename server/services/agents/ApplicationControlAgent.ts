import { daiSandbox } from '../execution/DAI'

let APP_ALLOWLIST: string[] = []
export function getAppAllowlist(): string[] { return APP_ALLOWLIST.slice() }
export function setAppAllowlist(list: string[]): string[] {
  const norm = Array.isArray(list) ? list.map(s => String(s || '')).filter(Boolean) : []
  APP_ALLOWLIST = Array.from(new Set(norm))
  return getAppAllowlist()
}

export async function runApp(path: string, args?: string[], simulate = true) {
  const allowed = getAppAllowlist()
  if (!allowed.includes(path)) throw new Error('app_not_allowed')
  const action = { type: 'app' as const, name: 'run_app', payload: { path, args: Array.isArray(args) ? args.map(String) : [] }, riskLevel: 0.8, tags: ['app','ipc'] }
  const res = await daiSandbox.execute(action, { simulate, allowApp: true })
  if (!res.ok) throw new Error(res.error || 'app_failed')
  return res.result
}
