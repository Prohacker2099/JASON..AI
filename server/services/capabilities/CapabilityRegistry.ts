import { z } from 'zod'

export type CapabilityLevel = 1 | 2 | 3

export type CapabilityRunOptions = {
  simulate?: boolean
  sandbox?: {
    allowedHosts?: string[]
    allowProcess?: boolean
    allowPowershell?: boolean
    allowApp?: boolean
    allowUI?: boolean
  }
}

export type CapabilityContext = {
  dai: { execute: (action: any, options?: any) => Promise<any> }
  flightSearchService: { search: (params: any) => Promise<any> }
  bdiCore: { submitDesire: (data: any) => Promise<any> }
  permissionManager: {
    createPrompt: (p: { level: CapabilityLevel; title: string; rationale?: string; options?: Array<'approve' | 'reject' | 'delay'>; meta?: any }) => { id: string }
    waitForDecision: (id: string, timeoutMs?: number) => Promise<'approve' | 'reject' | 'delay' | 'timeout'>
  }
  sse: { broadcast: (event: string, data: any) => void }
}

export type CapabilityMeta = {
  name: string
  title: string
  description: string
  level: CapabilityLevel
  tags?: string[]
}

export type CapabilityDef<TInput> = CapabilityMeta & {
  input: z.ZodType<TInput>
  getLevel?: (input: TInput) => CapabilityLevel
  run: (ctx: CapabilityContext, input: TInput, opt: CapabilityRunOptions) => Promise<any>
}

export class CapabilityRegistry {
  private caps = new Map<string, CapabilityDef<any>>()

  register<TInput>(cap: CapabilityDef<TInput>) {
    const name = String(cap.name || '').trim()
    if (!name) throw new Error('capability_name_required')
    this.caps.set(name, cap as any)
  }

  get(name: string): CapabilityDef<any> | null {
    return this.caps.get(String(name || '').trim()) || null
  }

  list(): CapabilityMeta[] {
    return Array.from(this.caps.values()).map((c) => ({
      name: c.name,
      title: c.title,
      description: c.description,
      level: c.level,
      tags: c.tags || [],
    }))
  }
}

export const capabilityRegistry = new CapabilityRegistry()
