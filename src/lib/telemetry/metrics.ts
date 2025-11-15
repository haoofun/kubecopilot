import { Prisma } from '@/generated/prisma'

import { prisma } from '@/lib/prisma'

export interface TelemetryWindow {
  since: Date
  until: Date
}

/** Aggregated request stats powering the observability telemetry overview screen. */
export interface ApiRequestStats {
  total: number
  successes: number
  failures: number
  byCategory: Record<
    string,
    {
      total: number
      successes: number
      failures: number
      p95DurationMs: number | null
    }
  >
  copilot: {
    total: number
    successes: number
    failures: number
  }
}

/** Breakdown of operation-plan throughput so reviewers can gauge AI adoption and risk. */
export interface OperationPlanStats {
  total: number
  executed: number
  failed: number
  dismissed: number
  pending: number
  successRate: number
  byRiskLevel: Record<string, number>
  topPrompts: Array<{
    promptId: string
    count: number
  }>
}

/** Combined metrics payload returned to `/api/telemetry/overview`. */
export interface TelemetryOverview {
  window: TelemetryWindow
  api: ApiRequestStats
  plans: OperationPlanStats
}

const HOURS_24 = 24 * 60 * 60 * 1000

/**
 * Returns aggregate API + plan metrics for a given window (default last 24h) so the dashboard can show usage charts.
 */
export async function getTelemetryOverview(
  window: Partial<TelemetryWindow> = {},
): Promise<TelemetryOverview> {
  const now = new Date()
  const since = window.since ?? new Date(now.getTime() - HOURS_24)
  const until = window.until ?? now

  const [apiStats, planStats] = await Promise.all([
    getApiRequestStats(since, until),
    getOperationPlanStats(since, until),
  ])

  return {
    window: { since, until },
    api: apiStats,
    plans: planStats,
  }
}

/** Counts API requests, success/failure splits, and per-category latency to feed telemetry cards. */
async function getApiRequestStats(
  since: Date,
  until: Date,
): Promise<ApiRequestStats> {
  const where = {
    createdAt: {
      gte: since,
      lte: until,
    },
  }

  const [aggregate, grouped] = await Promise.all([
    prisma.apiRequestLog.aggregate({
      _count: true,
      _sum: { durationMs: true },
      where,
    }),
    prisma.apiRequestLog.groupBy({
      by: ['category'],
      where,
      _count: true,
      _sum: { durationMs: true },
    }),
  ])

  const successes = await prisma.apiRequestLog.count({
    where: {
      ...where,
      statusCode: { lt: 400 },
    },
  })

  const copilotWhere = {
    ...where,
    route: 'api/ai/yaml/copilot',
  }

  const [copilotTotal, copilotSuccesses] = await Promise.all([
    prisma.apiRequestLog.count({ where: copilotWhere }),
    prisma.apiRequestLog.count({
      where: {
        ...copilotWhere,
        statusCode: { lt: 400 },
      },
    }),
  ])

  const total = aggregate._count ?? 0
  const failures = total - successes

  const byCategory: ApiRequestStats['byCategory'] = {}
  await Promise.all(
    grouped.map(async (entry) => {
      const category = entry.category
      const categoryTotal = entry._count ?? 0
      const categorySuccesses = await prisma.apiRequestLog.count({
        where: {
          ...where,
          category,
          statusCode: { lt: 400 },
        },
      })
      const p95 = await getP95Duration(category, since, until)

      byCategory[category] = {
        total: categoryTotal,
        successes: categorySuccesses,
        failures: categoryTotal - categorySuccesses,
        p95DurationMs: p95,
      }
    }),
  )

  return {
    total,
    successes,
    failures,
    byCategory,
    copilot: {
      total: copilotTotal,
      successes: copilotSuccesses,
      failures: copilotTotal - copilotSuccesses,
    },
  }
}

/** Computes the p95 duration for a given API category within the requested window. */
async function getP95Duration(
  category: Prisma.ApiRequestCategory,
  since: Date,
  until: Date,
): Promise<number | null> {
  const samples = await prisma.apiRequestLog.findMany({
    where: {
      category,
      createdAt: { gte: since, lte: until },
      durationMs: { not: null },
    },
    select: { durationMs: true },
    orderBy: { durationMs: 'asc' },
  })

  if (samples.length === 0) {
    return null
  }

  const index = Math.min(samples.length - 1, Math.floor(samples.length * 0.95))
  return samples[index]?.durationMs ?? null
}

/** Tallies operation-plan outcomes and top prompts for the telemetry view. */
async function getOperationPlanStats(
  since: Date,
  until: Date,
): Promise<OperationPlanStats> {
  const where = {
    createdAt: {
      gte: since,
      lte: until,
    },
  }

  const [
    total,
    executed,
    failed,
    dismissed,
    pending,
    riskGroups,
    promptGroups,
  ] = await Promise.all([
    prisma.operationPlan.count({ where }),
    prisma.operationPlan.count({
      where: { ...where, status: 'executed' },
    }),
    prisma.operationPlan.count({
      where: { ...where, status: 'failed' },
    }),
    prisma.operationPlan.count({
      where: { ...where, status: 'reverted' },
    }),
    prisma.operationPlan.count({
      where: { ...where, status: 'pending' },
    }),
    prisma.operationPlan.groupBy({
      by: ['riskLevel'],
      where,
      _count: true,
    }),
    prisma.operationPlan.groupBy({
      by: ['sourcePromptId'],
      where: {
        ...where,
        sourcePromptId: { not: null },
      },
      _count: true,
      orderBy: {
        _count: { sourcePromptId: 'desc' },
      },
      take: 5,
    }),
  ])

  const successRate = total === 0 ? 0 : executed / total
  const byRiskLevel: Record<string, number> = {}
  riskGroups.forEach((group) => {
    byRiskLevel[group.riskLevel] = group._count ?? 0
  })

  const topPrompts = promptGroups
    .filter((group) => group.sourcePromptId)
    .map((group) => ({
      promptId: group.sourcePromptId as string,
      count: group._count ?? 0,
    }))

  return {
    total,
    executed,
    failed,
    dismissed,
    pending,
    successRate,
    byRiskLevel,
    topPrompts,
  }
}
