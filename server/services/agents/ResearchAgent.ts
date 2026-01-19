import { daiSandbox } from '../execution/DAI'

function splitSentences(text: string): string[] {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(s => s.trim())
    .filter(Boolean)
}

const STOP = new Set([
  'the','is','in','at','of','a','an','to','and','or','but','with','on','for','as','by','from','that','this','it','be','are','was','were','has','had','have','not','can','will','would','should','could','if','then','than','so','we','you','they','i'
])

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(t => t && !STOP.has(t))
}

function scoreSentences(text: string): { sentence: string; score: number }[] {
  const sents = splitSentences(text)
  if (sents.length === 0) return []
  const freq = new Map<string, number>()
  for (const s of sents) {
    for (const t of tokenize(s)) freq.set(t, (freq.get(t) || 0) + 1)
  }
  const maxFreq = Array.from(freq.values()).reduce((a,b) => Math.max(a,b), 1)
  const norm = new Map<string, number>()
  for (const [k,v] of freq.entries()) norm.set(k, v / maxFreq)
  const scored = sents.map(s => {
    let sc = 0
    for (const t of tokenize(s)) sc += norm.get(t) || 0
    return { sentence: s, score: sc / Math.max(1, s.length) }
  })
  return scored
}

export class ResearchAgent {
  summarize(text: string, opts?: { maxSentences?: number; maxChars?: number }): { summary: string; sentences: string[] } {
    const maxSentences = Math.max(1, Math.min(12, Number(opts?.maxSentences ?? 5)))
    const maxChars = Math.max(200, Math.min(20000, Number(opts?.maxChars ?? 4000)))
    const scored = scoreSentences(text)
    const top = scored.sort((a,b) => b.score - a.score).slice(0, maxSentences).map(x => x.sentence)
    const summary = top.join(' ').slice(0, maxChars)
    return { summary, sentences: top }
  }

  async summarizeUrl(url: string, opts?: { selector?: string; maxSentences?: number; allowedHosts?: string[] }): Promise<{ title?: string; summary: string; textLen: number }> {
    const selector = opts?.selector || 'body'
    const action = { type: 'web' as const, name: 'research_fetch', payload: { url, mode: 'text', selector }, riskLevel: 0.2, tags: ['read','safe'] }
    const exec = await daiSandbox.execute(action, { simulate: false, allowedHosts: opts?.allowedHosts })
    if (!exec.ok) throw new Error(exec.error || 'fetch_failed')
    const text = String((exec.result && (exec.result.text || exec.result.html || exec.result.title)) || '')
    const title = exec.result?.title
    const { summary } = this.summarize(text, { maxSentences: opts?.maxSentences ?? 5 })
    return { title, summary, textLen: text.length }
  }
}

export const researchAgent = new ResearchAgent()
