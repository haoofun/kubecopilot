import type { Condition } from './common'

/**
 * Describes how StatefulSets roll pods so the observability board can explain controlled partitioned rollouts.
 */
export interface StatefulSetUpdateStrategy {
  /** type is RollingUpdate or OnDelete from `spec.updateStrategy.type`. */
  type: string
  rollingUpdate?: {
    /** partition specifies which ordinal begins updating, mirroring `spec.updateStrategy.rollingUpdate.partition`. */
    partition?: number
  }
}

/**
 * Template for PVCs generated per pod so storage demand is clear in the dashboard.
 */
export interface VolumeClaimTemplate {
  /** name maps to `spec.volumeClaimTemplates[].metadata.name` and is used to label per-pod storage. */
  name: string
  /** storageClass indicates which provisioner backs the claim (from `spec.storageClassName`). */
  storageClass?: string
  /** accessModes informs how pods can mount the volume, mirroring the template spec. */
  accessModes?: string[]
  /** storage is the requested capacity quantity from the template's resource requests. */
  storage?: string
}

/**
 * Summary data for StatefulSets derived from `apps/v1` status so the board can compare desired vs. ready replicas.
 */
export interface StatefulSetSummary {
  /** UID uniquely identifies the StatefulSet, matching `metadata.uid`. */
  uid: string
  /** name is the workload's `metadata.name`. */
  name: string
  /** namespace scopes the workload, mirroring `metadata.namespace`. */
  namespace: string
  /** desiredReplicas equals `spec.replicas`, communicating the intended scale. */
  desiredReplicas: number
  /** readyReplicas is drawn from `status.readyReplicas` so the board shows readiness compliance. */
  readyReplicas: number
  /** currentReplicas mirrors `status.currentReplicas`, indicating pods updated to the new revision. */
  currentReplicas: number
  /** updatedReplicas shows progress via `status.updatedReplicas`. */
  updatedReplicas: number
  /** creationTimestamp tells when the StatefulSet was created, taken from `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Extended StatefulSet detail including selectors, update strategy, pod management policy, PVC templates, and conditions.
 */
export interface StatefulSetDetail extends StatefulSetSummary {
  /** labels from `metadata.labels` power filtering and grouping. */
  labels: Record<string, string>
  /** annotations surface automation metadata from `metadata.annotations`. */
  annotations: Record<string, string>
  /** serviceName points to the governing Headless Service (`spec.serviceName`) enabling networking traceability. */
  serviceName: string | null
  /** selector reveals the label matches for pods via `spec.selector.matchLabels`. */
  selector: Record<string, string> | null
  /** strategy references the update strategy block described above to explain ordinal rollouts. */
  strategy: StatefulSetUpdateStrategy
  /** podManagementPolicy indicates OrderedReady vs Parallel, mirroring `spec.podManagementPolicy` for scheduling insights. */
  podManagementPolicy: string
  /** volumeClaims enumerates PVC templates so SREs know what storage each pod receives. */
  volumeClaims: VolumeClaimTemplate[]
  /** conditions echo `status.conditions`, highlighting partitions or stuck updates. */
  conditions: Condition[]
}
