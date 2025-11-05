import type { Condition } from './common'

export interface CronJobSummary {
  uid: string
  name: string
  namespace: string
  schedule: string
  suspend: boolean
  active: number
  lastScheduleTime?: string
  creationTimestamp: string
}

export interface CronJobDetail extends CronJobSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  concurrencyPolicy: string
  startingDeadlineSeconds?: number
  successfulJobsHistoryLimit?: number
  failedJobsHistoryLimit?: number
  selector: Record<string, string> | null
  conditions: Condition[]
}
