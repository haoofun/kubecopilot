// lib/k8s/types/pod.ts
import { OwnerReference, Condition } from './common'

export interface PodEnvVarSource {
  [key: string]: unknown
}

export interface PodEnvVar {
  name: string
  value?: string
  valueFrom?: PodEnvVarSource
}

export interface PodContainerResources {
  requests: Partial<Record<'cpu' | 'memory', string>>
  limits: Partial<Record<'cpu' | 'memory', string>>
}

export interface AggregatedResourceValues {
  cpu?: string
  memory?: string
}

export interface PodAggregatedResources {
  requests: AggregatedResourceValues
  limits: AggregatedResourceValues
}

export interface PodContainerLastState {
  phase: 'Waiting' | 'Terminated'
  reason?: string
  message?: string
  finishedAt?: string
}

export interface PodContainer {
  name: string
  image: string
  status?: string
  restarts: number
  ports: { name?: string; containerPort: number; protocol: string }[]
  env: PodEnvVar[]
  volumeMounts: { name: string; mountPath: string; readOnly?: boolean }[]
  resources: PodContainerResources
  lastState?: PodContainerLastState
}

export interface PodVolume {
  name: string
  type: string // e.g., 'ConfigMap', 'Secret', 'PersistentVolumeClaim'
}

export interface PodSummary {
  uid: string
  name: string
  namespace: string
  status: string
  restarts: number
  resources: PodAggregatedResources
  nodeName: string | null
  creationTimestamp: string
  ip: string
  owner: OwnerReference | null
}

export interface PodDetail extends PodSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  owner: OwnerReference | null
  containers: PodContainer[]
  volumes: PodVolume[]
  conditions: Condition[]
}
