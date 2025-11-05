// lib/k8s/types/namespace.ts
// 命名空间内各类工作负载的摘要
export interface NamespaceWorkloadSummary {
  deployments: { count: number; ready: number }
  statefulSets: { count: number; ready: number }
  daemonSets: { count: number; ready: number }
  pods: { count: number; running: number; succeeded: number; failed: number }
  jobs: { count: number; succeeded: number; failed: number }
  cronJobs: { count: number; active: number }
}

// 命名空间内网络资源的摘要
export interface NamespaceNetworkSummary {
  services: { count: number }
  ingresses: { count: number }
}

// 命名空间内配置和存储资源的摘要
export interface NamespaceConfigSummary {
  configMaps: { count: number }
  secrets: { count: number }
  persistentVolumeClaims: { count: number }
}

// 命名空间资源使用情况
export interface NamespaceResourceUsage {
  // 从 ResourceQuota 或 LimitRange 获取的资源限制
  limits: { cpu: string; memory: string }
  requests: { cpu: string; memory: string }
  // 未来从 Prometheus 等监控系统获取的实际使用情况
  usage?: { cpu: string; memory: string; unit?: string }
}

export interface NamespaceSummary {
  uid: string
  name: string
  status: string
  creationTimestamp: string
}

export interface NamespaceDetail extends NamespaceSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  workloads: NamespaceWorkloadSummary
  networking: NamespaceNetworkSummary
  config: NamespaceConfigSummary
  resourceUsage: NamespaceResourceUsage | null
}
