import type { V1CronJob } from '@kubernetes/client-node'

import type { Condition } from '../types/common'
import type { CronJobDetail, CronJobSummary } from '../types/cronjob'

type CronJobConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date
  lastProbeTime?: Date
}

/** Pulls CronJob conditions out of the status block so the dashboard can expose scheduling issues. */
const extractConditions = (cronJob: V1CronJob): Condition[] => {
  const status = cronJob.status as
    | { conditions?: CronJobConditionLike[] }
    | undefined
  const conditions = status?.conditions ?? []

  return conditions.map((condition) => ({
    type: condition.type ?? '',
    status: condition.status ?? '',
    reason: condition.reason ?? '',
    message: condition.message ?? '',
    lastUpdateTime:
      condition.lastTransitionTime?.toISOString() ??
      condition.lastProbeTime?.toISOString() ??
      '',
  }))
}

/** Creates the CronJobSummary used in scheduler tables on the observability board. */
export const transformCronJobToSummary = (
  cronJob: V1CronJob,
): CronJobSummary => ({
  uid: cronJob.metadata?.uid ?? '',
  name: cronJob.metadata?.name ?? '',
  namespace: cronJob.metadata?.namespace ?? '',
  schedule: cronJob.spec?.schedule ?? '* * * * *',
  suspend: cronJob.spec?.suspend ?? false,
  active: cronJob.status?.active?.length ?? 0,
  lastScheduleTime: cronJob.status?.lastScheduleTime?.toISOString(),
  creationTimestamp: cronJob.metadata?.creationTimestamp?.toISOString() ?? '',
})

/**
 * Builds a detailed CronJob payload so the board can show policies, history limits, selectors, and condition data.
 */
export const transformCronJobToDetail = (cronJob: V1CronJob): CronJobDetail => {
  const summary = transformCronJobToSummary(cronJob)

  return {
    ...summary,
    labels: cronJob.metadata?.labels ?? {},
    annotations: cronJob.metadata?.annotations ?? {},
    concurrencyPolicy: cronJob.spec?.concurrencyPolicy ?? 'Allow',
    startingDeadlineSeconds: cronJob.spec?.startingDeadlineSeconds ?? undefined,
    successfulJobsHistoryLimit:
      cronJob.spec?.successfulJobsHistoryLimit ?? undefined,
    failedJobsHistoryLimit: cronJob.spec?.failedJobsHistoryLimit ?? undefined,
    selector: cronJob.spec?.jobTemplate.spec?.selector?.matchLabels ?? null,
    conditions: extractConditions(cronJob),
  }
}
