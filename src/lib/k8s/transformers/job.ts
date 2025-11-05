import type { V1Job, V1JobCondition } from '@kubernetes/client-node'

import type { Condition } from '../types/common'
import type { JobDetail, JobSummary } from '../types/job'

const toConditions = (conditions: V1JobCondition[] | undefined): Condition[] =>
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '',
    status: condition.status ?? '',
    reason: condition.reason ?? '',
    message: condition.message ?? '',
    lastUpdateTime:
      condition.lastTransitionTime?.toISOString() ??
      condition.lastProbeTime?.toISOString() ??
      '',
  }))

export const transformJobToSummary = (job: V1Job): JobSummary => ({
  uid: job.metadata?.uid ?? '',
  name: job.metadata?.name ?? '',
  namespace: job.metadata?.namespace ?? '',
  completions: job.spec?.completions ?? null,
  succeeded: job.status?.succeeded ?? 0,
  failed: job.status?.failed ?? 0,
  active: job.status?.active ?? 0,
  creationTimestamp: job.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformJobToDetail = (job: V1Job): JobDetail => {
  const summary = transformJobToSummary(job)

  return {
    ...summary,
    labels: job.metadata?.labels ?? {},
    annotations: job.metadata?.annotations ?? {},
    selector: job.spec?.selector?.matchLabels ?? null,
    completionMode: job.spec?.completionMode ?? undefined,
    backoffLimit: job.spec?.backoffLimit ?? undefined,
    parallelism: job.spec?.parallelism ?? undefined,
    activeDeadlineSeconds: job.spec?.activeDeadlineSeconds ?? undefined,
    conditions: toConditions(job.status?.conditions),
  }
}
