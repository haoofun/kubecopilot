// lib/k8s/types/deployment.ts
import { OwnerReference, Condition } from './common'
import { PodContainer, PodSummary } from './pod'

export interface DeploymentStrategy {
  type: string // e.g., 'RollingUpdate'
  rollingUpdate?: {
    maxUnavailable?: number | string
    maxSurge?: number | string
  }
}

export interface DeploymentSummary {
  uid: string
  name: string
  namespace: string
  // 副本状态，UI 中通常显示为 "Ready / Desired" e.g., "3/3"
  readyReplicas: number
  desiredReplicas: number
  updatedReplicas: number
  availableReplicas: number
  creationTimestamp: string
}

export interface DeploymentDetail extends DeploymentSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  owner: OwnerReference | null
  strategy: DeploymentStrategy
  // Pod 选择器
  selector: Record<string, string> | null
  // 重要的状态条件，用于诊断问题
  conditions: Condition[]
  // Pod 模板中的容器定义，用于展示将要创建的 Pod 的规格
  containers: PodContainer[]
  pods?: PodSummary[] // optional, for detail view only
}
