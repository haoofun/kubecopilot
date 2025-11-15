import type { Condition } from './common'

/**
 * Summary row for Jobs so the observability board can track batch workloads created from `batch/v1` Job resources.
 */
export interface JobSummary {
  /** UID keeps each Job distinct in historical charts, mirroring `metadata.uid`. */
  uid: string
  /** Human-readable Job name from `metadata.name`, displayed directly in the dashboard. */
  name: string
  /** Namespace partitions Jobs for multi-tenant observability and equals `metadata.namespace`. */
  namespace: string
  /** Desired completions show how many pods must finish, using `spec.completions` from Kubernetes. */
  completions: number | null
  /** succeeded counts run completions via `status.succeeded`, powering success gauges. */
  succeeded: number
  /** failed comes from `status.failed`, letting the board spotlight retries. */
  failed: number
  /** active indicates currently running pods from `status.active`, helping show real-time concurrency. */
  active: number
  /** creationTimestamp fuels rollout timelines and equals `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Extended job detail that surfaces selectors, scheduling knobs, and conditions to explain batch execution plans.
 */
export interface JobDetail extends JobSummary {
  /** labels reflect deployment metadata (from `metadata.labels`) that the board uses for filtering. */
  labels: Record<string, string>
  /** annotations carry runbook links (from `metadata.annotations`) surfaced in the UI. */
  annotations: Record<string, string>
  /** selector reveals which pods belong to the Job via `spec.selector.matchLabels`, enabling drill-through from pods. */
  selector: Record<string, string> | null
  /** completionMode surfaces `spec.completionMode` (Indexed vs NonIndexed) so operators know how success is tracked. */
  completionMode?: string
  /** backoffLimit mirrors `spec.backoffLimit`, letting the board warn when Jobs are about to stop retrying. */
  backoffLimit?: number
  /** parallelism informs how many pods run concurrently, drawn from `spec.parallelism`. */
  parallelism?: number
  /** activeDeadlineSeconds indicates when Kubernetes will terminate the Job, mirroring the spec field for SLA projections. */
  activeDeadlineSeconds?: number
  /** conditions list the `status.conditions` entries used to annotate success/failure timelines. */
  conditions: Condition[]
}
