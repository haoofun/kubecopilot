import type { Condition } from './common'

export interface StatefulSetUpdateStrategy {
  type: string
  rollingUpdate?: {
    partition?: number
  }
}

export interface VolumeClaimTemplate {
  name: string
  storageClass?: string
  accessModes?: string[]
  storage?: string
}

export interface StatefulSetSummary {
  uid: string
  name: string
  namespace: string
  desiredReplicas: number
  readyReplicas: number
  currentReplicas: number
  updatedReplicas: number
  creationTimestamp: string
}

export interface StatefulSetDetail extends StatefulSetSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  serviceName: string | null
  selector: Record<string, string> | null
  strategy: StatefulSetUpdateStrategy
  podManagementPolicy: string
  volumeClaims: VolumeClaimTemplate[]
  conditions: Condition[]
}
