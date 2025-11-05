// lib/k8s/types/service.ts
export interface ServicePort {
  name?: string
  protocol: string
  port: number // Service 暴露的端口
  targetPort: number | string | null // 容器的目标端口
  nodePort?: number // 当 type 为 NodePort 时
}

export interface Endpoint {
  ip: string
  nodeName: string | null
  ready: boolean
  target: {
    // 引用这个 Endpoint 指向的目标，通常是 Pod
    kind: string
    name: string
    uid: string
  } | null
}

export interface ServiceSummary {
  uid: string
  name: string
  namespace: string
  type: string
  clusterIP: string
  // 外部 IP 可能有多个，也可能是一个 Hostname
  externalIPs: string[]
  // 简化的端口信息，e.g., ["80:8080/TCP", "443:8443/TCP"]
  ports: string[]
  creationTimestamp: string
}

export interface ServiceDetail extends Omit<ServiceSummary, 'ports'> {
  labels: Record<string, string>
  annotations: Record<string, string>
  // Pod 选择器，关联 Service 与 Pods
  selector: Record<string, string> | null
  sessionAffinity: string
  sessionAffinityConfig?: {
    clientIPTimeoutSeconds?: number
  }
  // 完整的、结构化的端口信息
  fullPorts: ServicePort[]
  endpoints: Endpoint[]
}
