export type ActionRegistrar = (name: string, handler: (input: any) => Promise<any>) => void
export type PlannerRegistrar = (name: string, compiler: (goal: string, ctx?: any) => any) => void
export type ContextSourceRegistrar = (name: string, source: () => Promise<any>) => void
const actions = new Map<string, (input: any) => Promise<any>>()
const planners = new Map<string, (goal: string, ctx?: any) => any>()
const sources = new Map<string, () => Promise<any>>()
export const registerAction: ActionRegistrar = (n, h) => { actions.set(String(n), async (i) => h(i)) }
export const registerPlanner: PlannerRegistrar = (n, c) => { planners.set(String(n), (g, ctx) => c(g, ctx)) }
export const registerContextSource: ContextSourceRegistrar = (n, s) => { sources.set(String(n), async () => s()) }
export function getAction(name: string) { return actions.get(String(name)) || null }
export function getPlanner(name: string) { return planners.get(String(name)) || null }
export async function readContext() { const out: Record<string, any> = {}; for (const [k, fn] of sources) { try { out[k] = await fn() } catch { out[k] = null } } return out }
export default { registerAction, registerPlanner, registerContextSource, getAction, getPlanner, readContext }
