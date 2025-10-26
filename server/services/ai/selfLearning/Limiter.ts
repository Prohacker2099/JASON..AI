export class Semaphore {
  private available: number
  private queue: Array<() => void> = []
  constructor(count: number) { this.available = Math.max(0, Math.floor(count)) || 0 }
  async acquire(): Promise<void> {
    if (this.available > 0) { this.available--; return }
    await new Promise<void>(resolve => this.queue.push(resolve))
  }
  release(): void {
    const next = this.queue.shift()
    if (next) next()
    else this.available++
  }
  setLimit(n: number) {
    const prev = this.available + this.queue.length
    const totalInUse = Math.max(0, prev - this.available)
    this.available = Math.max(0, Math.floor(n) - totalInUse)
  }
}

export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  constructor(private rps: number, capacity?: number) {
    this.capacity = Math.max(1, Math.floor(capacity ?? rps))
    this.tokens = this.capacity
    this.lastRefill = Date.now()
  }
  private refill() {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    if (elapsed <= 0) return
    const add = elapsed * this.rps
    this.tokens = Math.min(this.capacity, this.tokens + add)
    this.lastRefill = now
  }
  async removeTokens(n = 1): Promise<void> {
    while (true) {
      this.refill()
      if (this.tokens >= n) { this.tokens -= n; return }
      const deficit = n - this.tokens
      const waitMs = Math.max(50, Math.ceil((deficit / this.rps) * 1000))
      await new Promise(r => setTimeout(r, waitMs))
    }
  }
  setRate(rps: number) { this.rps = Math.max(0.1, rps) }
}
