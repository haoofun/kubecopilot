import type { V1Node, V1NodeCondition } from '@kubernetes/client-node'

import type { Condition } from '../types/common'
import type { NodeDetail, NodeSummary } from '../types/node'

const deriveRoles = (node: V1Node): string[] => {
  const roles: string[] = []
  const labels = node.metadata?.labels ?? {}

  Object.entries(labels).forEach(([key, value]) => {
    if (key.startsWith('node-role.kubernetes.io/')) {
      const role = key.split('/')[1]
      roles.push(role || 'unknown')
    } else if (key === 'kubernetes.io/role' && value) {
      roles.push(value)
    }
  })

  return roles.length > 0 ? roles : ['worker']
}

const deriveStatus = (node: V1Node): string => {
  const readyCondition = node.status?.conditions?.find(
    (condition) => condition.type === 'Ready',
  )
  return readyCondition?.status === 'True' ? 'Ready' : 'NotReady'
}

const formatConditions = (
  conditions: V1NodeCondition[] | undefined,
): Condition[] =>
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '',
    status: condition.status ?? '',
    reason: condition.reason ?? '',
    message: condition.message ?? '',
    lastUpdateTime:
      condition.lastHeartbeatTime?.toISOString() ??
      condition.lastTransitionTime?.toISOString() ??
      '',
  }))

export const transformNodeToSummary = (node: V1Node): NodeSummary => ({
  uid: node.metadata?.uid ?? '',
  name: node.metadata?.name ?? '',
  roles: deriveRoles(node),
  status: deriveStatus(node),
  osImage: node.status?.nodeInfo?.osImage ?? undefined,
  creationTimestamp: node.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformNodeToDetail = (node: V1Node): NodeDetail => ({
  ...transformNodeToSummary(node),
  labels: node.metadata?.labels ?? {},
  annotations: node.metadata?.annotations ?? {},
  statusDetail: {
    capacity: Object.fromEntries(
      Object.entries(node.status?.capacity ?? {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
    allocatable: Object.fromEntries(
      Object.entries(node.status?.allocatable ?? {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
    addresses: (node.status?.addresses ?? []).map((address) => ({
      type: address.type ?? '',
      address: address.address ?? '',
    })),
    conditions: formatConditions(node.status?.conditions),
  },
})
