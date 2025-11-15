import type { Condition } from './common'

/**
 * Snapshot of a CronJob so the observability board can track scheduled automation derived from `batch/v1` CronJobs.
 */
export interface CronJobSummary {
  /** UID uniquely identifies the CronJob (`metadata.uid`) for history. */
  uid: string
  /** name comes from `metadata.name` and displays in schedulers list. */
  name: string
  /** namespace scopes the schedule to a tenant, mirroring `metadata.namespace`. */
  namespace: string
  /** schedule is the Cron expression from `spec.schedule`, rendered verbatim for clarity. */
  schedule: string
  /** suspend indicates whether Kubernetes will skip runs, mapping to `spec.suspend`. */
  suspend: boolean
  /** active counts currently running Jobs from `status.active.length`, letting the board show live executions. */
  active: number
  /** lastScheduleTime is the previous run timestamp from `status.lastScheduleTime` for timing insights. */
  lastScheduleTime?: string
  /** creationTimestamp highlights how long the automation has existed, mirroring `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Full CronJob detail augmenting the summary with policies, selectors, and conditions.
 */
export interface CronJobDetail extends CronJobSummary {
  /** labels help filter schedules by team or environment via `metadata.labels`. */
  labels: Record<string, string>
  /** annotations pull in runbook links or approvals from `metadata.annotations`. */
  annotations: Record<string, string>
  /** concurrencyPolicy explains how overlaps are handled, straight from `spec.concurrencyPolicy`. */
  concurrencyPolicy: string
  /** startingDeadlineSeconds indicates how late a job may start, mirroring the spec value to inform SLO breach risk. */
  startingDeadlineSeconds?: number
  /** successfulJobsHistoryLimit shows how many completed Jobs Kubernetes keeps, surfaced from the spec for retention planning. */
  successfulJobsHistoryLimit?: number
  /** failedJobsHistoryLimit parallels the failed history limit setting from the spec to aid troubleshooting. */
  failedJobsHistoryLimit?: number
  /** selector lists the labels used to match Jobs/pods, mirroring `spec.jobTemplate.spec.selector`. */
  selector: Record<string, string> | null
  /** conditions pull from `status.conditions` so the board can highlight cron suspensions or missed schedules. */
  conditions: Condition[]
}
