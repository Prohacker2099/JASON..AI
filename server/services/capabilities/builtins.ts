import { z } from 'zod'
import type { CapabilityRegistry } from './CapabilityRegistry'
import { ghostWorkspaceManager } from '../automation/GhostWorkspaceManager'
import { WindowsUIAutomationAdapter } from '../agents/WindowsUIAutomationAgent'
import { GhostHandAgent } from '../automation/GhostHandAgent'
import { FlightArbitrageAgent } from '../agents/FlightArbitrageAgent'
import { superCreatorCapabilities } from './SuperCreatorCapabilities'

export function registerBuiltinCapabilities(registry: CapabilityRegistry) {
  registry.register({
    name: 'flights.search',
    title: 'Flight Search',
    description: 'Search flights with date windows and return cheapest offer',
    level: 1,
    tags: ['flights', 'search', 'travel'],
    input: z.object({
      origin: z.string().min(2),
      destination: z.string().min(2),
      departureDate: z.string().min(4),
      departureDateTo: z.string().optional(),
      returnDate: z.string().optional(),
      returnDateFrom: z.string().optional(),
      returnDateTo: z.string().optional(),
      passengers: z.number().min(1).max(9).optional(),
      cabin: z.string().optional(),
      currency: z.string().optional(),
      limit: z.number().min(1).max(50).optional(),
    }),
    run: async (ctx, input, opt) => {
      const res = await ctx.flightSearchService.search(input)
      try { ctx.sse.broadcast('capability:flights.search', { input, meta: res?.meta, best: res?.best }) } catch { }
      return res
    },
  })

  registry.register({
    name: 'web.read_text',
    title: 'Web Read Text',
    description: 'Fetch a URL in a headless browser and extract visible text from a selector',
    level: 1,
    tags: ['web', 'read', 'scrape'],
    input: z.object({
      url: z.string().url(),
      selector: z.string().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'web',
        name: 'web.read_text',
        tags: ['web', 'read'],
        payload: { url: input.url, mode: 'text', selector: input.selector || 'body' },
      }
      const out = await ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
      try { ctx.sse.broadcast('capability:web.read_text', { url: input.url, ok: out?.ok }) } catch { }
      return out
    },
  })

  registry.register({
    name: 'web.read_html',
    title: 'Web Read HTML',
    description: 'Fetch a URL in a headless browser and extract HTML from a selector',
    level: 1,
    tags: ['web', 'read', 'scrape'],
    input: z.object({
      url: z.string().url(),
      selector: z.string().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'web',
        name: 'web.read_html',
        tags: ['web', 'read'],
        payload: { url: input.url, mode: 'html', selector: input.selector || 'body' },
      }
      const out = await ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
      try { ctx.sse.broadcast('capability:web.read_html', { url: input.url, ok: out?.ok }) } catch { }
      return out
    },
  })

  registry.register({
    name: 'http.request',
    title: 'HTTP Request',
    description: 'Make an HTTP request (host allowlist enforced by sandbox options)',
    level: 2,
    tags: ['http', 'network'],
    input: z.object({
      url: z.string().url(),
      method: z.string().optional(),
      headers: z.record(z.string(), z.string()).optional(),
      body: z.any().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'http',
        name: 'http.request',
        tags: ['http', 'network'],
        payload: { url: input.url, method: input.method || 'GET', headers: input.headers || {}, body: input.body },
      }
      const out = await ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
      try { ctx.sse.broadcast('capability:http.request', { url: input.url, ok: out?.ok, status: out?.status }) } catch { }
      return out
    },
  })

  registry.register({
    name: 'file.read',
    title: 'Read File',
    description: 'Read a local file',
    level: 1,
    tags: ['file', 'read'],
    input: z.object({
      path: z.string().min(1),
      encoding: z.string().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'file',
        name: 'file.read',
        tags: ['file', 'read'],
        payload: { op: 'read', path: input.path, encoding: input.encoding || 'utf8' },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
    },
  })

  registry.register({
    name: 'file.append',
    title: 'Append File',
    description: 'Append content to a local file',
    level: 2,
    tags: ['file', 'write'],
    input: z.object({
      path: z.string().min(1),
      content: z.string(),
      encoding: z.string().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'file',
        name: 'file.append',
        tags: ['file', 'write'],
        payload: { op: 'append', path: input.path, content: input.content, encoding: input.encoding || 'utf8' },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
    },
  })

  registry.register({
    name: 'file.write',
    title: 'Write File',
    description: 'Write/overwrite a local file (L3)',
    level: 3,
    tags: ['file', 'overwrite'],
    input: z.object({
      path: z.string().min(1),
      content: z.string(),
      encoding: z.string().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'file',
        name: 'file.write',
        tags: ['file', 'overwrite', 'delete'],
        payload: { op: 'write', path: input.path, content: input.content, encoding: input.encoding || 'utf8', __approved: true },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
    },
  })

  registry.register({
    name: 'file.delete',
    title: 'Delete File',
    description: 'Delete a local file (L3)',
    level: 3,
    tags: ['file', 'delete'],
    input: z.object({
      path: z.string().min(1),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'file',
        name: 'file.delete',
        tags: ['file', 'delete'],
        payload: { op: 'delete', path: input.path, __approved: true },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
    },
  })

  registry.register({
    name: 'app.launch',
    title: 'Launch App',
    description: 'Launch a Windows app executable',
    level: 2,
    tags: ['app', 'desktop'],
    input: z.object({
      path: z.string().min(1),
      args: z.array(z.string()).optional(),
      ghost: z.boolean().optional(),
      desktopName: z.string().optional(),
      timeoutMs: z.number().optional(),
    }),
    run: async (ctx, input, opt) => {
      const ghost = input.ghost ?? true
      const desktopName = (input.desktopName && input.desktopName.trim()) ? input.desktopName.trim() : (ghost ? 'JASON_Workspace' : undefined)
      const action = {
        type: 'app',
        name: 'app.launch',
        tags: ['app', 'desktop'],
        payload: { path: input.path, args: input.args || [], ghost, desktopName, timeoutMs: input.timeoutMs },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowApp: true })
    },
  })

  registry.register({
    name: 'ui.window.find',
    title: 'Find Window',
    description: 'Find a desktop window by title (Windows UI Automation)',
    level: 2,
    tags: ['ui', 'desktop'],
    input: z.object({
      windowTitle: z.string().min(1),
      desktopName: z.string().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'ui',
        name: 'ui.window.find',
        tags: ['ui', 'desktop'],
        payload: { op: 'window.find', windowTitle: input.windowTitle, desktopName: input.desktopName },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'ui.tree.dump',
    title: 'Dump UI Tree',
    description: 'Enumerate UI controls to enable semantic targeting (Windows UI Automation)',
    level: 2,
    tags: ['ui', 'desktop'],
    input: z.object({
      desktopName: z.string().optional(),
      windowTitle: z.string().optional(),
      maxItems: z.number().optional(),
      includeOffscreen: z.boolean().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'ui',
        name: 'ui.tree.dump',
        tags: ['ui', 'desktop'],
        payload: {
          op: 'ui.tree.dump',
          desktopName: input.desktopName,
          windowTitle: input.windowTitle,
          maxItems: input.maxItems,
          includeOffscreen: input.includeOffscreen,
        },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'ui.control.search',
    title: 'Search UI Controls',
    description: 'Search UI controls by label text (query) and optional controlType (Windows UI Automation)',
    level: 2,
    tags: ['ui', 'desktop'],
    input: z.object({
      desktopName: z.string().optional(),
      windowTitle: z.string().optional(),
      query: z.string().min(1),
      controlType: z.string().optional(),
      maxResults: z.number().optional(),
      includeOffscreen: z.boolean().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'ui',
        name: 'ui.control.search',
        tags: ['ui', 'desktop'],
        payload: {
          op: 'control.search',
          desktopName: input.desktopName,
          windowTitle: input.windowTitle,
          query: input.query,
          controlType: input.controlType,
          maxResults: input.maxResults,
          includeOffscreen: input.includeOffscreen,
        },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'ui.ocr.read_text',
    title: 'OCR Read Text',
    description: 'Read visible text from a window/screen using OCR (requires tesseract on PATH)',
    level: 2,
    tags: ['ui', 'desktop'],
    input: z.object({
      desktopName: z.string().optional(),
      windowTitle: z.string().optional(),
      timeoutMs: z.number().optional(),
    }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'ui',
        name: 'ui.ocr.read_text',
        tags: ['ui', 'desktop'],
        payload: { op: 'ocr.read_text', desktopName: input.desktopName, windowTitle: input.windowTitle, timeoutMs: input.timeoutMs },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'vlm.visual_click',
    title: 'VLM Visual Click',
    description: 'Find a target by matching an image template on screen, then click it (template matching).',
    level: 2,
    tags: ['ui', 'desktop', 'vlm'],
    input: z
      .object({
        desktopName: z.string().optional(),
        templateImage: z.string().optional(),
        templatePath: z.string().optional(),
        region: z
          .object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number(),
          })
          .optional(),
        threshold: z.number().min(0).max(1).optional(),
        searchWindow: z.string().optional(),
      })
      .refine((v) => !!(v as any).templateImage || !!(v as any).templatePath, { message: 'templateImage_or_templatePath_required' }),
    run: async (ctx, input, opt) => {
      const desktopName = (input.desktopName && input.desktopName.trim()) ? input.desktopName.trim() : 'JASON_Workspace'
      const action = {
        type: 'ui',
        name: 'vlm.visual_click',
        tags: ['ui', 'desktop', 'vlm'],
        payload: {
          op: 'vlm.visual_click',
          desktopName,
          templateImage: input.templateImage,
          templatePath: input.templatePath,
          region: input.region,
          threshold: input.threshold,
          searchWindow: input.searchWindow,
        },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'vlm.semantic_click',
    title: 'VLM Semantic Click',
    description: 'Find a target by semantic text description on screen using the local VLM, then click it.',
    level: 2,
    tags: ['ui', 'desktop', 'vlm'],
    input: z.object({
      desktopName: z.string().optional(),
      targetText: z.string().min(1),
      region: z
        .object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        })
        .optional(),
      modelName: z.string().optional(),
      revision: z.string().optional(),
      timeoutMs: z.number().optional(),
    }),
    run: async (ctx, input, opt) => {
      const desktopName = (input.desktopName && input.desktopName.trim()) ? input.desktopName.trim() : 'JASON_Workspace'
      const action = {
        type: 'ui',
        name: 'vlm.semantic_click',
        tags: ['ui', 'desktop', 'vlm'],
        payload: {
          op: 'vlm.semantic_click',
          desktopName,
          targetText: input.targetText,
          region: input.region,
          modelName: input.modelName,
          revision: input.revision,
          timeoutMs: input.timeoutMs,
        },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'ui.sequence',
    title: 'UI Sequence',
    description: 'Run a sequence of UI actions under a single approval (Windows UI Automation)',
    level: 2,
    tags: ['ui', 'desktop'],
    input: z.object({
      desktopName: z.string().optional(),
      windowTitle: z.string().optional(),
      steps: z.array(z.object({
        op: z.enum(['invoke', 'set_value']),
        name: z.string().optional(),
        controlType: z.string().optional(),
        value: z.string().optional(),
        timeoutMs: z.number().optional(),
      }).refine((v) => !!(v as any).name || !!(v as any).controlType, { message: 'name_or_controlType_required' })).min(1).max(25),
    }),
    run: async (ctx, input, opt) => {
      const results: any[] = []
      for (const step of input.steps) {
        const action = {
          type: 'ui',
          name: 'ui.sequence',
          tags: ['ui', 'desktop'],
          payload: {
            op: step.op === 'invoke' ? 'control.invoke' : 'control.set_value',
            desktopName: input.desktopName,
            windowTitle: input.windowTitle,
            name: step.name || '',
            controlType: step.controlType,
            value: step.value,
            timeoutMs: step.timeoutMs,
          },
        }
        const out = await ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
        results.push(out)
        if (!out?.ok) return { ok: false, error: out?.error || 'ui_step_failed', results }
      }
      return { ok: true, results }
    },
  })

  registry.register({
    name: 'ui.invoke',
    title: 'Invoke UI Control',
    description: 'Invoke/click a UI control by semantic name/type (Windows UI Automation)',
    level: 2,
    tags: ['ui', 'desktop'],
    input: z.object({
      desktopName: z.string().optional(),
      windowTitle: z.string().optional(),
      name: z.string().optional(),
      controlType: z.string().optional(),
      timeoutMs: z.number().optional(),
    }).refine((v) => !!(v as any).name || !!(v as any).controlType, { message: 'name_or_controlType_required' }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'ui',
        name: 'ui.invoke',
        tags: ['ui', 'desktop'],
        payload: { op: 'control.invoke', desktopName: input.desktopName, windowTitle: input.windowTitle, name: input.name || '', controlType: input.controlType, timeoutMs: input.timeoutMs },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'ui.set_value',
    title: 'Set UI Value',
    description: 'Set a text/value field by semantic name/type (Windows UI Automation)',
    level: 2,
    tags: ['ui', 'desktop'],
    input: z.object({
      desktopName: z.string().optional(),
      windowTitle: z.string().optional(),
      name: z.string().optional(),
      controlType: z.string().optional(),
      value: z.string(),
      timeoutMs: z.number().optional(),
    }).refine((v) => !!(v as any).name || !!(v as any).controlType, { message: 'name_or_controlType_required' }),
    run: async (ctx, input, opt) => {
      const action = {
        type: 'ui',
        name: 'ui.set_value',
        tags: ['ui', 'desktop'],
        payload: { op: 'control.set_value', desktopName: input.desktopName, windowTitle: input.windowTitle, name: input.name || '', controlType: input.controlType, value: input.value, timeoutMs: input.timeoutMs },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate, allowUI: true })
    },
  })

  registry.register({
    name: 'process.run',
    title: 'Run Process',
    description: 'Run a process command (may require sandbox allowProcess)',
    level: 2,
    tags: ['process', 'exec'],
    input: z.object({
      command: z.string().min(1),
      args: z.array(z.string()).optional(),
    }),
    getLevel: (input) => {
      const s = `${input.command} ${(input.args || []).join(' ')}`.toLowerCase()
      if (/(winget\s+install|choco\s+install|npm\s+install|pip\s+install|setup\.exe|msiexec|format\s|rm\s|del\s|shutdown\s|restart\s)/.test(s)) return 3
      return 2
    },
    run: async (ctx, input, opt) => {
      const action = {
        type: 'process',
        name: 'process.run',
        tags: ['process', 'exec'],
        payload: { command: input.command, args: input.args || [] },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
    },
  })

  registry.register({
    name: 'powershell.run',
    title: 'Run PowerShell',
    description: 'Run a PowerShell command/script (may require sandbox allowPowershell)',
    level: 2,
    tags: ['powershell', 'exec'],
    input: z.object({
      command: z.string().optional(),
      script: z.string().optional(),
    }).refine((v) => !!v.command || !!v.script, { message: 'command_or_script_required' }),
    getLevel: (input) => {
      const s = `${input.command || ''} ${input.script || ''}`.toLowerCase()
      if (/(winget\s+install|choco\s+install|install\-module|start\-process|remove\-item|del\s|rm\s|format\s|shutdown\s|restart\s)/.test(s)) return 3
      return 2
    },
    run: async (ctx, input, opt) => {
      const action = {
        type: 'powershell',
        name: 'powershell.run',
        tags: ['powershell', 'exec'],
        payload: { command: input.command, script: input.script },
      }
      return ctx.dai.execute(action, { ...(opt.sandbox || {}), simulate: !!opt.simulate })
    },
  })

  // Register all Super Creator capabilities
  superCreatorCapabilities.forEach(cap => {
    registry.register({
      name: cap.name,
      title: cap.name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: cap.description,
      level: cap.level === 'Safe' ? 1 : cap.level === 'HighImpact' ? 3 : 2,
      tags: ['super-creator', 'ai', 'automation'],
      input: cap.inputSchema,
      run: async (ctx, input, opt) => {
        return await cap.handler(input, { dai: ctx.dai, userId: ctx.userId, sse: ctx.sse })
      },
    })
  })
}
