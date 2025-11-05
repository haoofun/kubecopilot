import type { Condition } from './common'

export interface NodeSummary {
  uid: string
  name: string
  roles: string[]
  status: string
  osImage?: string
  creationTimestamp: string
}

export interface NodeStatusDetail {
  capacity: Record<string, string>
  allocatable: Record<string, string>
  addresses: Array<{ type?: string; address?: string }>
  conditions: Condition[]
}

export interface NodeDetail extends NodeSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  statusDetail: NodeStatusDetail
}
