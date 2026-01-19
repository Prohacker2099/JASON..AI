// Dynamic Prisma import with graceful fallback to an in-memory shim.
// This prevents startup failures when prisma client is not generated.
type LearningEventRow = { event: string; data: any; timestamp?: number }

let prisma: any

async function initPrisma() {
  try {
    const mod: any = await import('@prisma/client')
    const PrismaClient = mod.PrismaClient
    const g: any = global as any
    if (!g.__prismaClient) {
      g.__prismaClient = new PrismaClient()
    }
    prisma = g.__prismaClient as any
  } catch (e: any) {
    // Fallback shim stores events in-memory for dev/testing
    console.warn('[prisma] Using in-memory shim (client unavailable):', e?.message || e)
    const mem: LearningEventRow[] = []
    prisma = {
      learningEvent: {
        create: async ({ data }: { data: LearningEventRow }) => {
          mem.push({ ...data, timestamp: Date.now() })
          return { id: mem.length, ...data }
        },
        findMany: async ({ where, orderBy, take }: { where?: { event?: string }, orderBy?: { timestamp: 'asc'|'desc' }, take?: number }) => {
          let rows = mem.slice()
          if (where?.event) rows = rows.filter(r => r.event === where.event)
          if (orderBy?.timestamp) {
            rows.sort((a, b) => (orderBy.timestamp === 'asc' ? 1 : -1) * ((a.timestamp || 0) - (b.timestamp || 0)))
          }
          if (typeof take === 'number') rows = rows.slice(0, take)
          return rows.map(r => ({ data: r }))
        }
      }
    } as any
  }
}

// Initialize immediately
initPrisma().catch(err => console.error('[prisma] Failed to initialize:', err))

export { prisma }
