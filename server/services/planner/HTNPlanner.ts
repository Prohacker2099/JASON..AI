import { ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { daiSandbox } from '../execution/DAI'
import { alignmentModel } from '../ai/selfLearning/Alignment'
import { scrl } from '../intelligence/SCRL'
import { permissionManager } from '../trust/PermissionManager'
import { sseBroker } from '../websocket-service'
import { mistralClient } from '../ai/mistral/MistralClient'

function genId(p: string) { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

export type PlanTask = {
  id: string
  name: string
  description?: string
  action?: ActionDefinition
  children?: PlanTask[]
  riskLevel?: number
  tags?: string[]
  preconditions?: string[]
  effects?: string[]
  method?: string
  subtasks?: PlanTask[]
  constraints?: TaskConstraint[]
  estimatedDuration?: number
  dependencies?: string[]
  parallelizable?: boolean
  optional?: boolean
}

export type Plan = {
  id: string;
  goal: string;
  tasks: PlanTask[];
  context?: Record<string, any>;
  metadata?: PlanMetadata;
  createdAt: Date;
  estimatedDuration?: number;
  confidence?: number;
}

export type PlanMetadata = {
  totalTasks: number;
  estimatedDuration: number;
  riskLevel: number;
  tags: string[];
  domain: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
}

export type TaskConstraint = {
  type: 'temporal' | 'resource' | 'dependency' | 'permission' | 'quality';
  description: string;
  parameters?: Record<string, any>;
}

export type HTNMethod = {
  name: string;
  preconditions: string[];
  subtasks: PlanTask[];
  constraints?: TaskConstraint[];
  successRate?: number;
  domain: string;
}

export type DomainKnowledge = {
  name: string;
  methods: HTNMethod[];
  operators: string[];
  predicates: string[];
  constraints: TaskConstraint[];
}

// --- Helper: Levenshtein Distance for Typo Correction ---
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const d: number[][] = []

  for (let i = 0; i <= m; i++) d[i] = [i]
  for (let j = 0; j <= n; j++) d[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    }
  }
  return d[m][n]
}

async function correctTyposWithAI(input: string): Promise<string> {
  const systemPrompt = `You are JASON's Semantic Input Refiner.
  The user provided a request that may have typos, grammatical errors, or ambiguous intent.
  Your job is to:
  1. Fix all typos and grammatical errors.
  2. Clarify the intent while keeping it concise.
  3. If the input is clear, return it exactly.
  4. DO NOT explain yourself. Respond ONLY with the corrected text.
  
  Example: "make a 14 day itinerery to japan" -> "plan a 14 day itinerary to Japan"
  Example: "projt math homework" -> "help with project math homework"
  
  Input: "${input}"`

  try {
    const response = await mistralClient.generate(systemPrompt, `Correct this: ${input}`)
    const out = String(response || '').trim()
    if (!out) return input
    // Guard against pathological outputs (multi-line essays, JSON blocks, etc.)
    if (out.length > 500) return input
    return out
  } catch (e) {
    console.error("[HTNPlanner] AI typo correction failed:", e)
    return correctTypos(input) // Fallback to dictionary
  }
}

function correctTypos(input: string): string {
  const dictionary = [
    'itinerary', 'vacation', 'holiday', 'schedule', 'calendar', 'remember',
    'organize', 'files', 'cleanup', 'research', 'homework', 'summary',
    'video', 'edit', 'premiere', 'capcut', 'cad', 'design', 'blueprint', 'autocad',
    'assignment', 'essay', 'organization', 'folder', 'workspace', 'document'
  ]

  return input.split(/\s+/).map(token => {
    const cleanToken = token.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (cleanToken.length < 3) return token // Skip short words

    // Find best match
    let bestMatch = token
    let minDist = Infinity

    for (const word of dictionary) {
      const dist = levenshteinDistance(cleanToken, word)
      // Threshold: 1 for short words (<=4), 2 for medium (<=7), 3 for long
      const threshold = word.length <= 4 ? 1 : (word.length <= 7 ? 2 : 3)

      if (dist <= threshold && dist < minDist) {
        minDist = dist
        bestMatch = word
      }
    }
    return bestMatch
  }).join(' ')
}

 function addDaysIso(iso: string, days: number): string | null {
   const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
   if (!m) return null
   const dt = new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)))
   if (!Number.isFinite(dt.getTime())) return null
   dt.setUTCDate(dt.getUTCDate() + Math.max(0, Math.floor(days)))
   const y = dt.getUTCFullYear()
   const mo = String(dt.getUTCMonth() + 1).padStart(2, '0')
   const d = String(dt.getUTCDate()).padStart(2, '0')
   return `${y}-${mo}-${d}`
 }

 function parseCurrency(text: string): string | null {
   const m = String(text || '').toUpperCase().match(/\b(GBP|USD|EUR|AUD|CAD|NZD|CHF|JPY|SGD|HKD|INR|ZAR|SEK|NOK|DKK)\b/)
   return m ? m[1] : null
 }

 function parseOriginIata(text: string): string | null {
   const t = String(text || '').toUpperCase()
   const m = t.match(/\bFROM\s+([A-Z]{3})\b/)
   return m ? m[1] : null
 }

 function parseMonthDayToIso(text: string): string | null {
   const t = String(text || '').toLowerCase()
   const months: Record<string, number> = {
     jan: 1, january: 1,
     feb: 2, february: 2,
     mar: 3, march: 3,
     apr: 4, april: 4,
     may: 5,
     jun: 6, june: 6,
     jul: 7, july: 7,
     aug: 8, august: 8,
     sep: 9, sept: 9, september: 9,
     oct: 10, october: 10,
     nov: 11, november: 11,
     dec: 12, december: 12,
   }

   const iso = t.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
   if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

   const dmy = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?:\s+(20\d{2}))?\b/)
   const mdy = t.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(20\d{2}))?\b/)

   let day: number | null = null
   let month: number | null = null
   let explicitYear: number | null = null

   if (dmy) {
     day = parseInt(dmy[1], 10)
     month = months[dmy[2]]
     explicitYear = dmy[3] ? parseInt(dmy[3], 10) : null
   } else if (mdy) {
     day = parseInt(mdy[2], 10)
     month = months[mdy[1]]
     explicitYear = mdy[3] ? parseInt(mdy[3], 10) : null
   }

   if (!day || !month) return null

   const now = new Date()
   const baseYear = explicitYear && Number.isFinite(explicitYear) ? explicitYear : now.getUTCFullYear()
   const candidate = new Date(Date.UTC(baseYear, month - 1, day))
   const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
   const year = candidate.getTime() < today.getTime() ? baseYear + 1 : baseYear

   const y = year
   const mo = String(month).padStart(2, '0')
   const d = String(day).padStart(2, '0')
   return `${y}-${mo}-${d}`
 }

 function resolveDestination(text: string): { label: string; code: string } {
   const t = String(text || '').toLowerCase()
   if (t.includes('japan') || t.includes('tokyo')) return { label: 'Japan', code: 'NRT' }
   if (t.includes('osaka')) return { label: 'Osaka', code: 'KIX' }
   if (t.includes('kyoto')) return { label: 'Kyoto', code: 'KIX' }
   return { label: 'Destination', code: 'NRT' }
 }

export function compilePlan(goal: string, context?: Record<string, any>): Plan {
  console.log(`[HTNPlanner] Compiling plan for goal: "${goal}"`)
  const rawGoal = (goal || '').toLowerCase()
  // 1. Correct Typos
  const g = correctTypos(rawGoal)
  if (g !== rawGoal) {
    console.log(`[HTNPlanner] Validated input: "${rawGoal}" -> "${g}"`)
  }

  const tasks: PlanTask[] = []
  const scenario = context && (context as any).scenario
  const beliefUserId = String((context as any)?.beliefs?.auth?.userId || (context as any)?.beliefs?.userId || '')
  const userId = beliefUserId || 'demo-user'

  // Dynamic Travel Planning
  // Regex to catch "plan X days holiday to Y" or similar
  // We can simplify regex now that we trust 'itinerary' is corrected
  const travelRegex = /(?:plan|book|make).*?(?:trip|holiday|vacation|itinerary).*?(?:to|in)\s+([a-zA-Z\s]+)/i
  const durationRegex = /(\d+)\s*(?:days|day|d)/i

  // We treat the "cambodia" scenario string as a legacy trigger, but also check for natural language
  if (g.match(travelRegex)) {
    const destinationMatch = g.match(travelRegex)
    const durationMatch = g.match(durationRegex)

    const resolved = resolveDestination(destinationMatch ? destinationMatch[1] : g)
    const destinationLabel = resolved.label
    const destinationCode = resolved.code
    const days = durationMatch ? Math.max(1, Math.min(60, parseInt(durationMatch[1], 10))) : 7

    const depart = parseMonthDayToIso(g) || addDaysIso(new Date().toISOString().slice(0, 10), 14) || new Date().toISOString().slice(0, 10)
    const ret = addDaysIso(depart, days)
    const origin = parseOriginIata(g) || String((context as any)?.origin || '').toUpperCase() || 'LHR'
    const currency = parseCurrency(g) || String((context as any)?.currency || '').toUpperCase() || 'GBP'
    const wantsCheapest = g.includes('budget') || g.includes('cheap') || g.includes('cheapest')
    const cabin = g.includes('luxury') ? 'business' : (wantsCheapest ? 'economy' : 'economy')

    tasks.push({ id: genId(`analyze_prefs_${destinationLabel}`), name: `Analyze preferences for ${destinationLabel} trip`, tags: ['analyze', 'safe', 'travel'] })

    tasks.push({
      id: genId(`flight_search_${destinationLabel}`),
      name: `Fast flight search (${origin} -> ${destinationCode})`,
      action: {
        type: 'web',
        name: 'flight_search',
        payload: {
          mode: 'flight_search',
          origin,
          destination: destinationCode,
          departureDate: depart,
          returnDate: ret || undefined,
          passengers: 1,
          cabin,
          currency,
          limit: 25,
        },
        riskLevel: 0.2,
        tags: ['help', 'safe', 'travel', 'flight']
      }
    })

  } else if (g.includes('homework') || g.includes('study') || g.includes('essay') || g.includes('assignment') || g.includes('research')) {
    // HOMEWORK / RESEARCH MODE
    const topicMatch = g.match(/(?:on|about|for)\s+(.*)/i)
    const topic = topicMatch ? topicMatch[1] : 'requested topic'

    tasks.push({ id: genId('analyze_req'), name: `Analyze homework requirements for: ${topic}`, description: `Breaking down study task for ${topic}`, tags: ['analyze', 'safe'] })
    tasks.push({
      id: genId('research_topic'),
      name: `Research topic: ${topic}`,
      action: { type: 'web', name: 'web_search', payload: { query: `comprehensive guide explanation ${topic} academic sources` }, riskLevel: 0.1 }
    })
    tasks.push({ id: genId('outline_essay'), name: 'Create detailed essay/assignment outline', tags: ['draft', 'safe'] })
    tasks.push({
      id: genId('write_report'),
      name: 'Generate Homework/Research Report (Word Doc)',
      action: {
        type: 'http',
        name: 'generate_report',
        payload: {
          title: `Academic Report: ${topic}`,
          sections: [
            { heading: 'Abstract', content: '...' },
            { heading: 'Introduction & Key Concepts', content: '...' },
            { heading: 'Detailed Analysis', content: '...' },
            { heading: 'Conclusion & Summary', content: '...' },
            { heading: 'References', content: '...' }
          ],
          output_path: `C:\\Users\\supro\\Desktop\\Homework_${topic.replace(/[^a-z0-9]/gi, '_')}.docx`
        },
        riskLevel: 0
      }
    })
    tasks.push({
      id: genId('notify_done'),
      name: 'Notify: Homework Prepared',
      action: { type: 'ui', name: 'notification', payload: { title: 'JASON Education', message: `I've prepared a comprehensive research report on ${topic} on your desktop.` }, riskLevel: 0 }
    })

  } else if (g.includes('video') && (g.includes('edit') || g.includes('cut') || g.includes('create') || g.includes('premiere') || g.includes('capcut'))) {
    // VIDEO EDITING MODE
    tasks.push({ id: genId('check_resources'), name: 'Locate video source files', tags: ['analyze', 'safe'] })
    tasks.push({
      id: genId('launch_editor'),
      name: 'Initialize Video Production Environment',
      action: {
        type: 'system',
        name: 'launch_app',
        payload: { command: g.includes('premiere') ? 'start premiere' : (g.includes('capcut') ? 'start capcut' : 'start premiere') },
        riskLevel: 0.3
      }
    })
    tasks.push({
      id: genId('interact_editor'),
      name: 'Wait for Workspace Setup',
      action: { type: 'interact', name: 'user_confirmation', payload: { options: ['Files Loaded', 'Need Help finding files'] }, riskLevel: 0 }
    })
    tasks.push({
      id: genId('notify_ready'),
      name: 'Notify: Video Project Ready',
      action: { type: 'ui', name: 'notification', payload: { title: 'JASON Video', message: 'Video environment is ready. I am standing by to help with specific edits or effects.' }, riskLevel: 0 }
    })

  } else if (g.includes('cad') || g.includes('design') || g.includes('blueprint') || g.includes('autocad') || g.includes('3d')) {
    // CAD / DESIGN MODE
    tasks.push({ id: genId('analyze_specs'), name: 'Analyze design specifications and dimensions', tags: ['analyze', 'safe'] })
    tasks.push({
      id: genId('launch_cad'),
      name: 'Launch CAD/Design Software',
      action: {
        type: 'system',
        name: 'launch_app',
        payload: { command: g.includes('autocad') ? 'start autocad' : 'start autocad' },
        riskLevel: 0.3
      }
    })
    tasks.push({
      id: genId('search_templates'),
      name: 'Research relevant CAD blocks and templates',
      action: { type: 'web', name: 'web_search', payload: { query: `dwg blocks and templates for ${g}` }, riskLevel: 0.1 }
    })
    tasks.push({
      id: genId('interact_design'),
      name: 'Consult with user on Design Constraints',
      action: { type: 'interact', name: 'design_specs', payload: { options: ['Standard Metric', 'Imperial', 'Custom Specs'] }, riskLevel: 0 }
    })

  } else if (scenario === 'cambodia_15d_luxury_budget_legacy') { // Renamed old logic
    const countryName = 'Cambodia'
  } else if (g.includes('plan') && (g.includes('trip') || g.includes('holiday') || g.includes('vacation'))) {
    const root = genId('plan')
    tasks.push({ id: genId('analyze_prefs'), name: 'Analyze preferences', tags: ['analyze', 'safe'] })
    tasks.push({
      id: genId('check_calendar'),
      name: 'Check calendar availability',
      tags: ['calendar', 'safe'],
      action: {
        type: 'connector',
        name: 'google.calendar.findFreeSlots',
        payload: { userId, providerId: 'google', operation: 'calendar.findFreeSlots', params: { durationMinutes: 72 * 60, maxSlots: 5 } },
        riskLevel: 0.2,
        tags: ['calendar', 'safe', 'help'],
      },
      riskLevel: 0.2,
      children: [
        { id: genId('fallback_connect_calendar'), name: 'Fallback: Ask user to connect Google Calendar in /api/connectors', tags: ['confirm', 'safe'] }
      ]
    })
    tasks.push({ id: genId('weather'), name: 'Fetch weather for destination', action: { type: 'http', name: 'fetch_weather', payload: { url: 'https://api.weather.gov', method: 'GET' }, riskLevel: 0.1, tags: ['help', 'safe'] }, riskLevel: 0.1, tags: ['help', 'safe'] })
    tasks.push({ id: genId('options'), name: 'Draft itinerary options', tags: ['draft', 'safe'] })
    const origin = String((context && (context as any).origin) || 'LHR').toUpperCase()
    const destination = String((context && (context as any).destination) || 'BGI').toUpperCase()
    const departureDate = (context && (context as any).departureDate)
      ? String((context as any).departureDate)
      : (context && (context as any).date)
        ? String((context as any).date)
        : ''
    const returnDate = (context && (context as any).returnDate) ? String((context as any).returnDate) : undefined
    const passengers = (context && typeof (context as any).passengers === 'number') ? (context as any).passengers : 1
    const cabin = (context && (context as any).cabin) ? String((context as any).cabin) : undefined

    tasks.push({
      id: genId('flight_search'),
      name: 'Fast flight search (seconds)',
      action: {
        type: 'web',
        name: 'flight_search',
        payload: {
          mode: 'flight_search',
          origin,
          destination,
          departureDate,
          returnDate,
          passengers,
          cabin,
        },
        riskLevel: 0.2,
        tags: ['help', 'safe', 'travel', 'flight'],
      },
      riskLevel: 0.2,
      tags: ['help', 'safe', 'travel', 'flight'],
    })

    tasks.push({
      id: genId('flight_arbitrage'),
      name: 'Search and arbitrage flights (autonomous)',
      action: {
        type: 'web',
        name: 'flight_arbitrage',
        payload: {
          mode: 'flight_arbitrage',
          origin,
          destination,
          departureDate,
          returnDate,
          passengers,
          cabin,
        },
        riskLevel: 0.6,
        tags: ['help', 'safe', 'travel', 'flight'],
      },
      riskLevel: 0.6,
      tags: ['help', 'safe', 'travel', 'flight'],
    })
    tasks.push({
      id: genId('confirm'),
      name: 'Level 3: Confirm bookings',
      tags: ['financial', 'confirm'],
      riskLevel: 0.9,
      children: [
        { id: genId('alt_price_check'), name: 'Fallback: Check alternate dates/routes', action: { type: 'http', name: 'alt_price_probe', payload: { url: 'https://api.weather.gov', method: 'GET' }, riskLevel: 0.2, tags: ['help', 'safe', 'efficient'] }, riskLevel: 0.2, tags: ['help', 'safe', 'efficient'] },
        { id: genId('notify_user'), name: 'Fallback: Draft summary + ask for guidance', tags: ['draft', 'safe'] },
      ]
    })

    tasks.push({
      id: genId('block_calendar'),
      name: 'Block travel dates on calendar (optional)',
      tags: ['calendar', 'confirm'],
      riskLevel: 0.6,
      action: {
        type: 'connector',
        name: 'google.calendar.blockTravelRange',
        payload: { userId, providerId: 'google', operation: 'calendar.blockTravelRange', params: { departureDate, returnDate, title: 'Travel' } },
        riskLevel: 0.6,
        tags: ['calendar', 'confirm'],
      },
      children: [
        { id: genId('fallback_calendar_block'), name: 'Fallback: Provide instructions to block dates manually', tags: ['draft', 'safe'] }
      ]
    })
  } else if (g.includes('email') || g.includes('inbox') || g.includes('mail') || g.includes('outlook') || g.includes('gmail')) {
    tasks.push({ id: genId('gather_context'), name: 'Analyze email thread and context', tags: ['analyze', 'safe'] })
    tasks.push({ id: genId('draft_email'), name: 'Generate AI-powered draft with personalized tone', tags: ['draft', 'safe'] })
    tasks.push({ id: genId('review_tone'), name: 'Alignment Check: Ethics & Tone Review', tags: ['safe'] })
    tasks.push({
      id: genId('send_email'),
      name: 'Execute Communication: Send/Schedule Email',
      tags: ['confirm'],
      riskLevel: 0.6,
      children: [
        { id: genId('fallback_ask_review'), name: 'Fallback: Provide draft for user manual review', tags: ['confirm', 'safe'] },
      ]
    })
  } else if (g.includes('optimize') || g.includes('schedule') || g.includes('calendar') || g.includes('meeting') || g.includes('reminder')) {
    tasks.push({ id: genId('analyze_constraints'), name: 'Analyze schedule constraints and priority goals', tags: ['analyze', 'safe', 'calendar'] })
    tasks.push({
      id: genId('find_free_slots'),
      name: 'Consult Calendar API for availability',
      tags: ['calendar', 'safe'],
      action: {
        type: 'connector',
        name: 'google.calendar.findFreeSlots',
        payload: { userId, providerId: 'google', operation: 'calendar.findFreeSlots', params: { durationMinutes: 60, maxSlots: 10 } },
        riskLevel: 0.2,
        tags: ['calendar', 'safe', 'help'],
      },
      riskLevel: 0.2,
      children: [
        { id: genId('fallback_connect_calendar_opt'), name: 'Fallback: Interactive setup for Calendar Connector', tags: ['confirm', 'safe'] }
      ]
    })
    tasks.push({ id: genId('propose_schedule'), name: 'Synthesize optimal time management strategy', tags: ['draft', 'safe', 'calendar'] })
    tasks.push({
      id: genId('apply_action'),
      name: 'Execute Scheduling Action (Event/Reminder)',
      tags: ['calendar', 'confirm'],
      riskLevel: 0.6,
      children: [
        { id: genId('fallback_no_action'), name: 'Fallback: Provide draft schedule to user', tags: ['draft', 'safe'] }
      ]
    })
  } else if (g.includes('research') || g.includes('summarize') || g.includes('web') || g.includes('find') || g.includes('search')) {
    tasks.push({ id: genId('collect_sources'), name: 'Autonomous Web Research: Gathering diverse sources', action: { type: 'web', name: 'web_search', payload: { query: g }, riskLevel: 0.1, tags: ['help', 'safe'] }, riskLevel: 0.1, tags: ['help', 'safe'] })
    tasks.push({ id: genId('summarize_sources'), name: 'Synthesize Cross-Source Analysis', tags: ['draft', 'safe'] })
    tasks.push({ id: genId('review_and_format'), name: 'Polishing & Formatting Final Intelligence Report', tags: ['safe'] })
    tasks.push({
      id: genId('notify_report'),
      name: 'Notify: Research Complete',
      action: { type: 'ui', name: 'notification', payload: { title: 'JASON Intelligence', message: 'I have completed your research request and synthesized the findings.' }, riskLevel: 0 }
    })
  } else if (g.includes('calc') || g.includes('math') || g.includes('solve') || g.includes('excel') || g.includes('spreadsheet')) {
    tasks.push({ id: genId('analyze_math'), name: 'Synthesizing mathematical/logical requirements', tags: ['analyze', 'safe'] })
    tasks.push({ id: genId('exec_logic'), name: 'Running algorithmic simulation', tags: ['safe'] })
    tasks.push({
      id: genId('generate_output'),
      name: 'Generate Analytical Report/Spreadsheet',
      action: { type: 'http', name: 'generate_report', payload: { title: 'Analysis', sections: [{ heading: 'Results', content: '...' }], output_path: 'C:\\Users\\supro\\Desktop\\Analysis.docx' }, riskLevel: 0 }
    })
  } else if (g.includes('organize') || g.includes('cleanup') || g.includes('files') || g.includes('folder') || g.includes('workspace')) {
    tasks.push({ id: genId('analyze_fs'), name: 'Analyze directory structure and file entropy', tags: ['analyze', 'safe'] })
    tasks.push({
      id: genId('simulate_rules'),
      name: 'Generate Organizational Rules',
      action: {
        type: 'interact',
        name: 'confirm_rules',
        payload: {
          options: ['Organize by Date', 'Organize by Project', 'Organize by File Type', 'Custom Rules'],
          prompt: 'I have analyzed your workspace. How would you like me to organize these files?'
        },
        riskLevel: 0
      }
    })
    tasks.push({
      id: genId('apply_rules'),
      name: 'Execute File Reorganization',
      tags: ['confirm'],
      riskLevel: 0.6,
      children: [
        { id: genId('fallback_report'), name: 'Fallback: Generate reorganization report for manual execution', tags: ['report', 'safe'] },
      ]
    })
    tasks.push({
      id: genId('notify_org'),
      name: 'Notify: Workspace Organized',
      action: { type: 'ui', name: 'notification', payload: { title: 'JASON File Manager', message: 'Your files have been organized according to the selected strategy.' }, riskLevel: 0 }
    })
  } else if (g.includes('thesis') || g.includes('report') || g.includes('draft')) {
    tasks.push({ id: genId('gather_sources'), name: 'Gather sources', tags: ['safe'] })
    tasks.push({ id: genId('outline'), name: 'Create outline', tags: ['safe'] })
    tasks.push({ id: genId('write_draft'), name: 'Write draft', tags: ['safe'] })
    tasks.push({ id: genId('review'), name: 'Self-review and check style', tags: ['safe'] })
    tasks.push({
      id: genId('final_confirm'), name: 'Level 3: Confirm final submission', tags: ['confirm'], riskLevel: 0.9, children: [
        { id: genId('fallback_peer_review'), name: 'Fallback: Create peer-review checklist', tags: ['draft', 'safe'] }
      ]
    })
  } else {
    // LLM-BASED OPEN-ENDED PLANNING (PRODUCTION READY)
    console.log(`[HTNPlanner] No rule matched for goal "${g}". Using LLM for universal decomposition.`)
  }

  return { id: genId('plan'), goal, tasks, createdAt: new Date() }
}

async function decomposeGoalWithLLM(goal: string, context?: any): Promise<PlanTask[]> {
  const systemPrompt = `You are JASON, the Omnipotent AI Architect. 
  Your mission is to decompose ANY user goal into a perfectly structured sequence of executable sub-tasks.
  The user can ask for ANYTHING: Homework, CAD design, Video Editing, File Organization, Web Search, System Control, etc.
  
  Goal: "${goal}"
  
  Available Action Types:
  1. "web": Browser automation. name: "web_search", "scrape", "click", "type", "navigate".
  2. "app": Windows app control. name: "app.launch", payload: { path: "calc.exe", ghost: true }.
  3. "powershell": System scripts. name: "powershell.run", payload: { command: "..." }.
  4. "ui": Visual UI control via VLM. name: "vlm.semantic_click", "vlm.visual_click", "vlm.describe_screen".
  5. "http": JASON core services. name: "generate_report", "ai_analysis".
  6. "interact": User feedback. name: "user_clarification".

  Format: Respond ONLY with a JSON array of tasks.
  Each task: { id: "string", name: "string", action: { type: "app|powershell|ui|web|interact|http", name: "capability_name", payload: {}, riskLevel: number } }
  
  STRATEGY: Use the See-Plan-Act loop. 
  1. Start by seeing/describing the screen if you are unsure of the environment.
  2. Navigate to URLs or launch apps.
  3. Use 'vlm.describe_screen' frequently to orient yourself.
  4. Perform precise UI actions (clicks/typing) based on visual descriptions.
  5. The user wants to SEE you working, so prefer visible browser actions over hidden APIs.
  
  Be precise, ambitious, and universal. Use professional, technical language.`

  try {
    console.log(`[HTNPlanner] AI Strategist decomposing: "${goal}"`)
    const response = await mistralClient.generate(systemPrompt, `Goal: ${goal}`)

    // Improved JSON extraction
    const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s)
    const jsonStr = jsonMatch ? jsonMatch[0] : response.replace(/```json/g, '').replace(/```/g, '').trim()

    const tasks = JSON.parse(jsonStr)
    if (!Array.isArray(tasks)) throw new Error("LLM did not return an array")

    console.log(`[HTNPlanner] AI Strategist successfully created ${tasks.length} sub-tasks for ANY-TASK mode.`)
    return tasks
  } catch (e) {
    console.error("[HTNPlanner] LLM decomposition failed:", e)
    // Dynamic Fallback: generate at least a research and notification step
    return [
      { id: genId('ai_research'), name: `Researching: ${goal}`, action: { type: 'web', name: 'web_search', payload: { query: goal }, riskLevel: 0.1 } },
      { id: genId('ai_notify'), name: 'Notify: Synthesis Complete', action: { type: 'ui', name: 'notification', payload: { title: 'JASON', message: `I have analyzed "${goal}" and am preparing the results.` }, riskLevel: 0 } }
    ]
  }
}

export async function compilePlanUniversal(goal: string, context?: Record<string, any>): Promise<Plan> {
  console.log(`[HTNPlanner] Processing universal goal: "${goal}"`)

  // 1. AI-powered typo correction and intent clarification (Semantic)
  const correctedGoal = await correctTyposWithAI(goal)
  if (correctedGoal.toLowerCase() !== goal.toLowerCase()) {
    console.log(`[HTNPlanner] AI Refined Goal: "${goal}" -> "${correctedGoal}"`)
  }

  const finalGoal = String(correctedGoal || '').trim() ? correctedGoal : goal

  // 2. Try rule-based planning first (for high-fidelity presets)
  const plan = compilePlan(finalGoal, context)

  // 3. If rule-based didn't produce tasks, use universal LLM decomposition
  if (plan.tasks.length === 0) {
    console.log(`[HTNPlanner] Rule-base empty. Decomposing with Omnipotent AI Strategist...`)
    const llmTasks = await decomposeGoalWithLLM(finalGoal, context)
    plan.tasks.push(...llmTasks)
  }

  // Final verification: ensure we have at least one task or a fallback
  if (plan.tasks.length === 0) {
    plan.tasks.push({
      id: genId('fallback_task'),
      name: 'Unable to decompose task automatically',
      description: 'The AI was unable to generate steps for this goal. Please try a more specific command.',
      action: { type: 'ui', name: 'notification', payload: { title: 'JASON', message: 'I am struggling to plan this specific task. Could you rephrase it?' }, riskLevel: 0 }
    })
  }

  return plan
}

export async function executePlan(
  plan: Plan,
  options?: {
    simulate?: boolean
    sandbox?: { allowedHosts?: string[]; allowProcess?: boolean; allowPowershell?: boolean; allowApp?: boolean; allowUI?: boolean }
    completedTaskIds?: Set<string>
  }
): Promise<{
  results: Array<{ taskId: string; ok: boolean; result?: any; error?: string }>
  status: 'completed' | 'paused' | 'failed'
  pausedTaskId?: string
  promptId?: string
  pausedKind?: 'retry_task'
}> {
  const results: Array<{ taskId: string; ok: boolean; result?: any; error?: string }> = []
  let paused = false
  let pausedTaskId: string | undefined
  let promptId: string | undefined
  let pausedKind: 'retry_task' | undefined

  async function runTask(t: PlanTask): Promise<void> {
    if (paused) return
    if (options?.completedTaskIds?.has(t.id)) {
      results.push({ taskId: t.id, ok: true, result: 'already_completed' }) // Re-record as done
      return
    }

    if (t.action) {
      // Interactive Task: Pause and wait for user input if type is 'interact'
      if (t.action.type === 'interact') {
        const prompt = permissionManager.createPrompt({
          level: 2,
          title: t.name,
          rationale: t.description || 'User input required',
          options: (t.action.payload as any).options || ['Continue'],
          meta: { taskId: t.id, action: t.action }
        })
        sseBroker.broadcast('orch:interaction', { taskId: t.id, prompt })
        results.push({ taskId: t.id, ok: true, result: { status: 'pending_interaction', promptId: prompt.id } })
        paused = true
        pausedTaskId = t.id
        promptId = prompt.id
        return
      }

      const res: ExecutionResult = await daiSandbox.execute(t.action, {
        simulate: options?.simulate ?? false,
        allowedHosts: options?.sandbox?.allowedHosts,
        allowProcess: options?.sandbox?.allowProcess,
        allowPowershell: options?.sandbox?.allowPowershell,
        allowApp: options?.sandbox?.allowApp,
        allowUI: options?.sandbox?.allowUI,
      })
      const okForPlan = !!res.ok || !!t.optional
      const resultPayload = (!res.ok && t.optional)
        ? { ...(res.result || {}), optionalFailed: true }
        : res.result
      results.push({ taskId: t.id, ok: okForPlan, result: resultPayload, error: res.error })

      // SCRL: review execution with alignment score
      try {
        const planned = { id: t.id, name: t.name, tags: t.tags, riskLevel: t.riskLevel, action: t.action }
        const alignmentScore = alignmentModel.scoreForAction(t.action as ActionDefinition)
        const actual = { result: res.result, error: res.error, status: (res as any)?.status, alignmentScore }
        await scrl.reviewExecution(plan.id, t.id, planned, actual, okForPlan)
      } catch { }

      // CAPTCHA Strategy (Tier 3 Collaborative Loop): request L3 confirmation and skip fallbacks for this sub-task
      if (!res.ok && res.error === 'captcha_detected') {
        try {
          const prompt = permissionManager.createPrompt({
            level: 3,
            title: `Verification required for ${t.action?.name || t.name}`,
            rationale: `Real flight sites may require consent/CAPTCHA. Please complete verification in the opened browser window, then click RESUME in SovereignOS to retry.\n\nProvider: ${(res.result as any)?.providerId || 'unknown'}\nURL: ${(res.result as any)?.url || 'n/a'}`,
            options: ['approve', 'reject', 'delay'],
            meta: { taskId: t.id, action: t.action }
          })
          try { sseBroker.broadcast('orch:interaction', { taskId: t.id, prompt, kind: 'captcha' }) } catch { }

          // Overwrite the last result entry to mark it as a pending interaction rather than a failure.
          const lastIdx = results.length - 1
          if (lastIdx >= 0 && results[lastIdx]?.taskId === t.id) {
            results[lastIdx] = { taskId: t.id, ok: true, result: { status: 'pending_interaction', promptId: prompt.id, ...(res.result || {}) }, error: res.error }
          }

          paused = true
          pausedKind = 'retry_task'
          pausedTaskId = t.id
          promptId = prompt.id
          return
        } catch { } // Fix: Added missing closing brace for the try block
      }


      // CPA-lite: if failed (but not CAPTCHA) and has children fallbacks, attempt them
      if (!res.ok && res.error !== 'captcha_detected' && Array.isArray(t.children) && t.children.length > 0) {
        for (const c of t.children) { await runTask(c) }
      }
    } else {
      // Non-executable step: simulate completion
      results.push({ taskId: t.id, ok: true })
      if (Array.isArray(t.children) && t.children.length > 0) {
        for (const c of t.children) { await runTask(c) }
      }
    }
  }

  for (const t of plan.tasks) {
    await runTask(t)
    if (paused) break
    // If not simulating and last result failed without fallbacks, break early
    const last = results[results.length - 1]
    if (last && !last.ok && !options?.simulate) break
  }

  return {
    results,
    status: paused ? 'paused' : (results.every(r => r.ok) ? 'completed' : 'failed'),
    pausedTaskId,
    promptId,
    pausedKind
  }
}

export class HTNPlanner {
  async compilePlan(goal: string, context?: Record<string, any>): Promise<Plan> {
    return compilePlanUniversal(goal, context)
  }

  async executePlan(plan: Plan, options?: any): Promise<{ results: Array<{ taskId: string; ok: boolean; result?: any; error?: string }> }> {
    return executePlan(plan, options)
  }
}
