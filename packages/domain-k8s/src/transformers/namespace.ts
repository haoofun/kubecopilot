import type { V1Namespace } from '@kubernetes/client-node'

import type {
  NamespaceConfigSummary,
  NamespaceDetail,
  NamespaceNetworkSummary,
  NamespaceResourceUsage,
  NamespaceSummary,
  NamespaceWorkloadSummary,
} from '../types/namespace'

/** Provides zeroed workload counts so the observability board can safely render namespaces before metrics aggregate. */
const emptyWorkloads = (): NamespaceWorkloadSummary => ({
  deployments: { count: 0, ready: 0 },
  statefulSets: { count: 0, ready: 0 },
  daemonSets: { count: 0, ready: 0 },
  pods: { count: 0, running: 0, succeeded: 0, failed: 0 },
  jobs: { count: 0, succeeded: 0, failed: 0 },
  cronJobs: { count: 0, active: 0 },
})

/** Supplies default networking counts when no Services or Ingresses are present in Kubernetes. */
const emptyNetworking = (): NamespaceNetworkSummary => ({
  services: { count: 0 },
  ingresses: { count: 0 },
})

/** Generates empty config summaries so the board always shows ConfigMap/Secret/PVC sections. */
const emptyConfig = (): NamespaceConfigSummary => ({
  configMaps: { count: 0 },
  secrets: { count: 0 },
  persistentVolumeClaims: { count: 0 },
})

export interface NamespaceAggregates {
  /** Precomputed workload counts that the board injects to avoid recomputing after separate API calls. */
  workloads?: NamespaceWorkloadSummary
  /** Networking resource counts derived from Service/Ingress listings. */
  networking?: NamespaceNetworkSummary
  /** Configuration totals pulled from ConfigMaps/Secrets/PVCs. */
  config?: NamespaceConfigSummary
  /** Optional quota/usage blocks reflecting ResourceQuota or metrics data from Kubernetes. */
  resourceUsage?: NamespaceResourceUsage | null
}

/** Creates the NamespaceSummary displayed in the namespaces list within the observability board. */
export const transformNamespaceToSummary = (
  namespace: V1Namespace,
): NamespaceSummary => ({
  uid: namespace.metadata?.uid ?? '',
  name: namespace.metadata?.name ?? '',
  status: namespace.status?.phase ?? 'Unknown',
  creationTimestamp: namespace.metadata?.creationTimestamp?.toISOString() ?? '',
})

/**
 * Combines namespace metadata with aggregate stats so the board can show a holistic tenant view in one payload.
 */
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
