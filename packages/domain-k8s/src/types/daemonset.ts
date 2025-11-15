import type { Condition } from './common'

/**
 * Controls how DaemonSets roll nodes so the observability board can explain maintenance windows.
 */
export interface DaemonSetUpdateStrategy {
  /** type shows whether the strategy is RollingUpdate or OnDelete, mirroring `spec.updateStrategy.type`. */
  type: string
  rollingUpdate?: {
    /** maxUnavailable limits parallel node disruptions during updates, sourced from `spec.updateStrategy.rollingUpdate.maxUnavailable`. */
    maxUnavailable?: number | string
  }
}

/**
 * Summary row for DaemonSets derived from `apps/v1` status so the board can visualize coverage across nodes.
 */
export interface DaemonSetSummary {
  /** UID uniquely identifies the DaemonSet, matching `metadata.uid`. */
  uid: string
  /** name equals `metadata.name` and is shown in workload lists. */
  name: string
  /** namespace scopes the controller (`metadata.namespace`) so multi-tenant dashboards work. */
  namespace: string
  /** desiredPods equals `status.desiredNumberScheduled`, indicating how many nodes should run the daemon. */
  desiredPods: number
  /** currentPods reflect `status.currentNumberScheduled`, showing actual scheduling. */
  currentPods: number
  /** readyPods mirrors `status.numberReady`, so the board flags nodes missing the daemon. */
  readyPods: number
  /** updatedPods equals `status.updatedNumberScheduled`, which highlights rollout progress. */
  updatedPods: number
  /** creationTimestamp is sourced from `metadata.creationTimestamp`, helping timeline views. */
  creationTimestamp: string
}

/**
 * Detailed DaemonSet data including selectors, strategy, conditions, and scheduling constraints.
 */
export interface DaemonSetDetail extends DaemonSetSummary {
  /** labels pulled from `metadata.labels` power owner/environment filters. */
  labels: Record<string, string>
  /** annotations include controller hints stored in `metadata.annotations`. */
  annotations: Record<string, string>
  /** selector reveals which pods belong to the DaemonSet via `spec.selector.matchLabels`. */
  selector: Record<string, string> | null
  /** strategy captures the rollout behavior defined above. */
  strategy: DaemonSetUpdateStrategy
  /** conditions mirror `status.conditions`, enabling the board to call out scheduling issues. */
  conditions: Condition[]
  /** nodeSelector surfaces targeted nodes using `spec.template.spec.nodeSelector` so ops can see placement intent. */
  nodeSelector: Record<string, string>
  /** tolerations list scheduling tolerations from the pod template, showing how the daemon bypasses taints. */
  tolerations: Array<{
    key?: string
    operator?: string
    value?: string
    effect?: string
  }>
}
