import type { V1Node, V1NodeCondition } from '@kubernetes/client-node'

import type { Condition } from '../types/common'
import type { NodeDetail, NodeSummary } from '../types/node'

/** Extracts node roles from labels so the observability board can group control-plane vs worker nodes. */
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

/** Collapses node Ready condition into a single status string shown in topology widgets. */
const deriveStatus = (node: V1Node): string => {
  const readyCondition = node.status?.conditions?.find(
    (condition) => condition.type === 'Ready',
  )
  return readyCondition?.status === 'True' ? 'Ready' : 'NotReady'
}

/** Normalizes raw node conditions into the shared Condition type rendered on the dashboard. */
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

/** Builds the lightweight node summary consumed by the observability board's cluster overview. */
export const transformNodeToSummary = (node: V1Node): NodeSummary => ({
  uid: node.metadata?.uid ?? '',
  name: node.metadata?.name ?? '',
  roles: deriveRoles(node),
  status: deriveStatus(node),
  osImage: node.status?.nodeInfo?.osImage ?? undefined,
  creationTimestamp: node.metadata?.creationTimestamp?.toISOString() ?? '',
})

/** Produces a full node detail payload so the board can present capacity, allocatable, addresses, and conditions. */
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
  taints: (node.spec?.taints ?? []).map((taint) => ({
    key: taint.key ?? undefined,
    value: taint.value ?? undefined,
    effect: taint.effect ?? undefined,
    timeAdded: taint.timeAdded?.toISOString() ?? undefined,
  })),
  kubeletVersion: node.status?.nodeInfo?.kubeletVersion ?? undefined,
  containerRuntimeVersion:
    node.status?.nodeInfo?.containerRuntimeVersion ?? undefined,
  podCIDR: node.spec?.podCIDR ?? undefined,
  podCIDRs: node.spec?.podCIDRs ?? [],
  providerID: node.spec?.providerID ?? undefined,
})
