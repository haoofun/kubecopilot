import { PrismaClient } from '@/generated/prisma'

/**
 * Reuses a single PrismaClient instance across Next.js hot reloads so telemetry + operation-plan writes don’t spawn
 * excess connections while the observability dashboard runs in dev mode.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
