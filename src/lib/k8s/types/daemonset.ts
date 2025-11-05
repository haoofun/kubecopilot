import type { Condition } from './common'

export interface DaemonSetUpdateStrategy {
  type: string
  rollingUpdate?: {
    maxUnavailable?: number | string
  }
}

export interface DaemonSetSummary {
  uid: string
  name: string
  namespace: string
  desiredPods: number
  currentPods: number
  readyPods: number
  updatedPods: number
  creationTimestamp: string
}

export interface DaemonSetDetail extends DaemonSetSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  selector: Record<string, string> | null
  strategy: DaemonSetUpdateStrategy
  conditions: Condition[]
  nodeSelector: Record<string, string>
  tolerations: Array<{
    key?: string
    operator?: string
    value?: string
    effect?: string
  }>
}
