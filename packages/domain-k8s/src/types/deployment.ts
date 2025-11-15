// lib/k8s/types/deployment.ts
import { OwnerReference, Condition } from './common'
import { PodContainer, PodSummary } from './pod'

/**
 * Captures the rollout strategy so the observability board can forecast surge/unavailable pods using Kubernetes deployment settings.
 */
export interface DeploymentStrategy {
  /** type shows if the rollout is RollingUpdate or Recreate, mirroring `spec.strategy.type`. */
  type: string // e.g., 'RollingUpdate'
  rollingUpdate?: {
    /** maxUnavailable matches `spec.strategy.rollingUpdate.maxUnavailable`, dictating how many replicas can drop during upgrades. */
    maxUnavailable?: number | string
    /** maxSurge equals `spec.strategy.rollingUpdate.maxSurge`, used to anticipate extra pod scheduling. */
    maxSurge?: number | string
  }
}

/**
 * Summary of a Deployment that surfaces replica health in the dashboard based on `apps/v1` Deployment status.
 */
export interface DeploymentSummary {
  /** UID uniquely identifies the Deployment (from `metadata.uid`) for change tracking. */
  uid: string
  /** Name displayed in workload tables, sourced from `metadata.name`. */
  name: string
  /** Namespace indicates tenancy, pulled from `metadata.namespace`. */
  namespace: string
  // 副本状态，UI 中通常显示为 "Ready / Desired" e.g., "3/3"
  /** readyReplicas reveal how many pods are serving traffic, mapping to `status.readyReplicas`. */
  readyReplicas: number
  /** desiredReplicas equals `spec.replicas` to show the intended scale. */
  desiredReplicas: number
  /** updatedReplicas shows how many pods are at the latest spec (`status.updatedReplicas`). */
  updatedReplicas: number
  /** availableReplicas come from `status.availableReplicas`, telling the board about availability gaps. */
  availableReplicas: number
  /** creationTimestamp indicates when the workload first launched, mirroring `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Full Deployment details mixing metadata, pod template, and conditions to explain rollout state.
 */
export interface DeploymentDetail extends DeploymentSummary {
  /** labels (from `metadata.labels`) let operators filter by team/release. */
  labels: Record<string, string>
  /** annotations pass along runbook links or git SHAs from `metadata.annotations`. */
  annotations: Record<string, string>
  /** owner references the controlling higher-level resource (e.g., Argo Application) from `metadata.ownerReferences`. */
  owner: OwnerReference | null
  /** strategy contains the rollout knobs described above, enabling the board to explain surge budgets. */
  strategy: DeploymentStrategy
  // Pod 选择器
  /** selector shows which pods belong to the Deployment via `spec.selector.matchLabels`. */
  selector: Record<string, string> | null
  /** templateLabels captures `spec.template.metadata.labels` for quick inspection. */
  templateLabels: Record<string, string>
  /** templateAnnotations mirrors `spec.template.metadata.annotations`. */
  templateAnnotations: Record<string, string>
  /** minReadySeconds exposes rollout readiness delays from `spec.minReadySeconds`. */
  minReadySeconds?: number
  /** progressDeadlineSeconds mirrors the spec field to explain rollout timing. */
  progressDeadlineSeconds?: number
  /** revisionHistoryLimit shows how many revisions Kubernetes will retain. */
  revisionHistoryLimit?: number
  /** paused indicates whether the Deployment rollout is paused (`spec.paused`). */
  paused?: boolean
  // 重要的状态条件，用于诊断问题
  /** conditions correspond to `status.conditions`, so alerts can cite the exact failing condition. */
  conditions: Condition[]
  // Pod 模板中的容器定义，用于展示将要创建的 Pod 的规格
  /** containers mirror the pod template in `spec.template.spec.containers`, helping the board preview configs. */
  containers: PodContainer[]
  /** pods optionally lists the live pod summaries so users can jump from the Deployment detail to individual pods. */
  pods?: PodSummary[] // optional, for detail view only
}
