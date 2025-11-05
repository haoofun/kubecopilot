import type { Condition } from './common'

export interface JobSummary {
  uid: string
  name: string
  namespace: string
  completions: number | null
  succeeded: number
  failed: number
  active: number
  creationTimestamp: string
}

export interface JobDetail extends JobSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  selector: Record<string, string> | null
  completionMode?: string
  backoffLimit?: number
  parallelism?: number
  activeDeadlineSeconds?: number
  conditions: Condition[]
}
