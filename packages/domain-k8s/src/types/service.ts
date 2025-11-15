// lib/k8s/types/service.ts
/**
 * Structured representation of a Service port so the observability board can show how traffic is translated by Kubernetes.
 */
export interface ServicePort {
  /** Optional port name helps correlate traffic to app protocols, mirroring `spec.ports[].name`. */
  name?: string
  /** Protocol (TCP/UDP/SCTP) indicates network behavior and comes from `spec.ports[].protocol`. */
  protocol: string
  /** The exposed service port shown in topology views equals `spec.ports[].port`. */
  port: number // Service 暴露的端口
  /** targetPort reveals which container port receives the traffic, matching `spec.ports[].targetPort`. */
  targetPort: number | string | null // 容器的目标端口
  /** nodePort exposes the host-level port when type=NodePort, mapping to `spec.ports[].nodePort`. */
  nodePort?: number // 当 type 为 NodePort 时
}

/**
 * Captures resolved Service endpoints to show which pods back a Service at any time, mirroring the Endpoints resource.
 */
export interface Endpoint {
  /** Endpoint IP is the pod IP or external target from `subsets[].addresses[].ip`. */
  ip: string
  /** nodeName is surfaced so SREs know node placement, mirroring `addresses[].nodeName`. */
  nodeName: string | null
  /** ready flag tells the board whether the endpoint is receiving traffic, reflecting readiness in EndpointSlices. */
  ready: boolean
  target: {
    // 引用这个 Endpoint 指向的目标，通常是 Pod
    /** Kinds identify whether the endpoint points to a Pod or other resource, taken from owner references. */
    kind: string
    /** Target name lets the UI deep-link back to the object, typically the Pod's `metadata.name`. */
    name: string
    /** UID uniquely identifies the endpoint target, coming from the backed resource's `metadata.uid`. */
    uid: string
  } | null
}

/**
 * List row for Services that surfaces networking identity and connectivity information derived from the Service spec/status.
 */
export interface ServiceSummary {
  /** UID anchors time series for Services, mapping to `metadata.uid`. */
  uid: string
  /** name corresponds to `metadata.name` and is shown in service maps. */
  name: string
  /** namespace lets the board group Services per tenant, mirroring `metadata.namespace`. */
  namespace: string
  /** type communicates ClusterIP/NodePort/LoadBalancer, taken from `spec.type`. */
  type: string
  /** clusterIP displays the virtual IP assigned by Kubernetes (`spec.clusterIP`). */
  clusterIP: string
  // 外部 IP 可能有多个，也可能是一个 Hostname
  /** externalIPs/hostnames help ops teams reason about exposure, sourced from `spec.externalIPs` or status.loadBalancer. */
  externalIPs: string[]
  // 简化的端口信息，e.g., ["80:8080/TCP", "443:8443/TCP"]
  /** ports contains human-readable strings derived from ServicePort entries so tables stay compact. */
  ports: string[]
  /** creationTimestamp fuels change audit views and equals `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Extended Service detail including metadata, selectors, full port structs, and resolved endpoints.
 */
export interface ServiceDetail extends Omit<ServiceSummary, 'ports'> {
  /** labels pulled from `metadata.labels` allow filtering by team or tier. */
  labels: Record<string, string>
  /** annotations surface operational hints such as cloud LB IDs from `metadata.annotations`. */
  annotations: Record<string, string>
  // Pod 选择器，关联 Service 与 Pods
  /** selector explains which pods match the Service via `spec.selector`. */
  selector: Record<string, string> | null
  /** sessionAffinity indicates if sticky sessions are enabled, mirroring `spec.sessionAffinity`. */
  sessionAffinity: string
  /** sessionAffinityConfig conveys client IP timeout values from `spec.sessionAffinityConfig`. */
  sessionAffinityConfig?: {
    clientIPTimeoutSeconds?: number
  }
  // 完整的、结构化的端口信息
  /** fullPorts exposes the port tuples exactly as modeled in Kubernetes so operators can audit complex mappings. */
  fullPorts: ServicePort[]
  /** endpoints lists the concrete pods backing the Service so the board can diagnose skew between Services and workloads. */
  endpoints: Endpoint[]
}
