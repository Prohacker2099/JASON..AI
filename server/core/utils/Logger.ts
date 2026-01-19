import logger from '../../utils/logger'

export class Logger {
  private ctx: string

  constructor(ctx: string) {
    this.ctx = ctx
  }

  debug(message: string, meta?: any) {
    try {
      ;(logger as any).debug(`[${this.ctx}] ${message}`, meta)
    } catch {}
  }

  info(message: string, meta?: any) {
    try {
      ;(logger as any).info(`[${this.ctx}] ${message}`, meta)
    } catch {}
  }

  warn(message: string, meta?: any) {
    try {
      ;(logger as any).warn(`[${this.ctx}] ${message}`, meta)
    } catch {}
  }

  error(message: string, error?: any, meta?: any) {
    try {
      ;(logger as any).error(`[${this.ctx}] ${message}`, error, meta)
    } catch {}
  }
}
