// lib/k8s/types/namespace.ts
// 命名空间内各类工作负载的摘要
/**
 * Aggregates workload counts per namespace so the observability board can show which tenants run which controller types.
 */
export interface NamespaceWorkloadSummary {
  /** Deployment totals and readiness counts map to `apps/v1` Deployment status to flag rollout health. */
  deployments: { count: number; ready: number }
  /** StatefulSet counts reveal stateful workloads, using `status.readyReplicas` to capture readiness. */
  statefulSets: { count: number; ready: number }
  /** DaemonSet counts capture edge workloads with ready numbers from `status.numberReady`. */
  daemonSets: { count: number; ready: number }
  /** Pod stats (running/succeeded/failed) group namespaces by pod life cycle states taken from `Pod.status`. */
  pods: { count: number; running: number; succeeded: number; failed: number }
  /** Job stats rely on `status.succeeded/failed` so the board can flag failing batch workloads in a namespace. */
  jobs: { count: number; succeeded: number; failed: number }
  /** CronJob counts display scheduled automation derived from `batch/v1` CronJobs and their active jobs. */
  cronJobs: { count: number; active: number }
}

// 命名空间内网络资源的摘要
/**
 * Summaries of ingress and service objects allow the dashboard to highlight networking surface area per namespace.
 */
export interface NamespaceNetworkSummary {
  /** Service counts correspond to `v1/Service` objects so SREs can estimate load balancer/IP consumption. */
  services: { count: number }
  /** Ingress counts show HTTP entry points built from `networking.k8s.io/v1` Ingress resources. */
  ingresses: { count: number }
}

// 命名空间内配置和存储资源的摘要
/**
 * Configuration and storage inventory per namespace, mirroring ConfigMaps, Secrets, and PVCs in Kubernetes.
 */
export interface NamespaceConfigSummary {
  /** Number of ConfigMaps (`v1/ConfigMap`) so observers know how much configuration is scoped to the namespace. */
  configMaps: { count: number }
  /** Secret totals track sensitive assets from `v1/Secret` for compliance-focused dashboards. */
  secrets: { count: number }
  /** PersistentVolumeClaim counts expose storage demand created via `v1/PersistentVolumeClaim`. */
  persistentVolumeClaims: { count: number }
}

// 命名空间资源使用情况
/**
 * Bundle of requested/limited resources pulled from ResourceQuotas or LimitRanges so the UI can show quota pressure.
 */
export interface NamespaceResourceUsage {
  // 从 ResourceQuota 或 LimitRange 获取的资源限制
  /** Limit ceilings expressed in Kubernetes quantity strings so the board can show how close workloads are to the guardrails. */
  limits: { cpu: string; memory: string }
  /** Requested floors aggregated from quota specs to communicate guaranteed capacity per namespace. */
  requests: { cpu: string; memory: string }
  // 未来从 Prometheus 等监控系统获取的实际使用情况
  /** Optional live usage from metrics backends, aligned with Kubernetes CPU/memory units for direct comparison. */
  usage?: { cpu: string; memory: string; unit?: string }
}

/**
 * Headline namespace info the board needs to sort tenants and flag unhealthy ones.
 */
export interface NamespaceSummary {
  /** UID identifies the namespace uniquely and mirrors `metadata.uid`. */
  uid: string
  /** name is the namespace label from `metadata.name` displayed in resource trees. */
  name: string
  /** status surfaces if the namespace is Active/Terminating based on `status.phase`. */
  status: string
  /** creationTimestamp powers lifecycle analytics and equals `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Full namespace detail including metadata plus the nested summaries so the observability board can provide a single pane.
 */
export interface NamespaceDetail extends NamespaceSummary {
  /** labels come from `metadata.labels` allowing filters by team or environment. */
  labels: Record<string, string>
  /** annotations propagate governance details from `metadata.annotations`. */
  annotations: Record<string, string>
  /** workloads groups the controller counts described above, informing workload balance charts. */
  workloads: NamespaceWorkloadSummary
  /** networking shows how many Services/Ingresses exist to gauge exposure. */
  networking: NamespaceNetworkSummary
  /** config surfaces ConfigMap/Secret/PVC totals for ops hygiene. */
  config: NamespaceConfigSummary
  /** resourceUsage highlights quota allocations/usage so SREs can react before Kubernetes enforces limits. */
  resourceUsage: NamespaceResourceUsage | null
}
