import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

function toSqliteFileUrl(p: string) {
  return `file:${p.replace(/\\/g, '/')}`
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const candidates = [
    path.resolve(process.cwd(), 'jason.db'),
    path.resolve(process.cwd(), 'prisma', 'jason.db'),
    path.resolve(process.cwd(), '..', 'jason.db'),
    path.resolve(process.cwd(), '..', 'prisma', 'jason.db')
  ]

  const existing = candidates.find((p) => fs.existsSync(p))
  return toSqliteFileUrl(existing || candidates[0])
}

const url = resolveDatabaseUrl()

export const prisma = new PrismaClient({ datasources: { db: { url } } })