import type { V1Namespace } from '@kubernetes/client-node'

import type {
  NamespaceConfigSummary,
  NamespaceDetail,
  NamespaceNetworkSummary,
  NamespaceResourceUsage,
  NamespaceSummary,
  NamespaceWorkloadSummary,
} from '../types/namespace'

const emptyWorkloads = (): NamespaceWorkloadSummary => ({
  deployments: { count: 0, ready: 0 },
  statefulSets: { count: 0, ready: 0 },
  daemonSets: { count: 0, ready: 0 },
  pods: { count: 0, running: 0, succeeded: 0, failed: 0 },
  jobs: { count: 0, succeeded: 0, failed: 0 },
  cronJobs: { count: 0, active: 0 },
})

const emptyNetworking = (): NamespaceNetworkSummary => ({
  services: { count: 0 },
  ingresses: { count: 0 },
})

const emptyConfig = (): NamespaceConfigSummary => ({
  configMaps: { count: 0 },
  secrets: { count: 0 },
  persistentVolumeClaims: { count: 0 },
})

export interface NamespaceAggregates {
  workloads?: NamespaceWorkloadSummary
  networking?: NamespaceNetworkSummary
  config?: NamespaceConfigSummary
  resourceUsage?: NamespaceResourceUsage | null
}

export const transformNamespaceToSummary = (
  namespace: V1Namespace,
): NamespaceSummary => ({
  uid: namespace.metadata?.uid ?? '',
  name: namespace.metadata?.name ?? '',
  status: namespace.status?.phase ?? 'Unknown',
  creationTimestamp: namespace.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformNamespaceToDetail = (
  namespace: V1Namespace,
  aggregates: NamespaceAggregates = {},
): NamespaceDetail => {
  const summary = transformNamespaceToSummary(namespace)

  return {
    ...summary,
    labels: namespace.metadata?.labels ?? {},
    annotations: namespace.metadata?.annotations ?? {},
    workloads: aggregates.workloads ?? emptyWorkloads(),
    networking: aggregates.networking ?? emptyNetworking(),
    config: aggregates.config ?? emptyConfig(),
    resourceUsage:
      aggregates.resourceUsage !== undefined ? aggregates.resourceUsage : null,
  }
}
