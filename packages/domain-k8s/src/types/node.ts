import type { Condition } from './common'

/**
 * High-level node identity and health used to power the cluster topology view sourced from `Node` metadata and status.
 */
export interface NodeSummary {
  /** UID keeps nodes distinct in historical charts; it matches `metadata.uid`. */
  uid: string
  /** name renders in the topology map and comes from `metadata.name`. */
  name: string
  /** roles indicates master/worker taints derived from the well-known `node-role.kubernetes.io/*` labels. */
  roles: string[]
  /** status summarizes readiness conditions so the board can highlight NotReady nodes; it reflects `status.conditions`. */
  status: string
  /** osImage informs SREs about base image drift, mirroring `status.nodeInfo.osImage`. */
  osImage?: string
  /** creationTimestamp lets the board flag newly joined nodes, mapping to `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Detailed node status payload giving the dashboard capacity, allocatable resources, addresses, and conditions.
 */
export interface NodeStatusDetail {
  /** capacity shows the raw hardware totals from `status.capacity`, powering capacity utilization charts. */
  capacity: Record<string, string>
  /** allocatable tracks scheduled headroom derived from `status.allocatable` so schedulability warnings are accurate. */
  allocatable: Record<string, string>
  /** addresses list internal/external IPs per `status.addresses`, enabling cross-links to networking dashboards. */
  addresses: Array<{ type?: string; address?: string }>
  /** conditions expose Ready, MemoryPressure, etc., mirroring `status.conditions` for the board's health timeline. */
  conditions: Condition[]
}

/**
 * Extends the summary with metadata and detailed status so the observability board can show taints/labels alongside resource stats.
 */
export interface NodeDetail extends NodeSummary {
  /** labels surface scheduling attributes like zones (from `metadata.labels`) for topology filters. */
  labels: Record<string, string>
  /** annotations propagate cluster automation metadata from `metadata.annotations`. */
  annotations: Record<string, string>
  /** statusDetail includes the deep capacity/condition information the board renders in side panels. */
  statusDetail: NodeStatusDetail
  /** taints list scheduling taints from `spec.taints` for troubleshooting. */
  taints: Array<{
    key?: string
    value?: string
    effect?: string
    timeAdded?: string
  }>
  /** kubeletVersion is surfaced from `status.nodeInfo.kubeletVersion`. */
  kubeletVersion?: string
  /** containerRuntimeVersion echoes `status.nodeInfo.containerRuntimeVersion`. */
  containerRuntimeVersion?: string
  /** podCIDR(s) and providerID mirror fields from the node spec for networking context. */
  podCIDR?: string
  podCIDRs: string[]
  providerID?: string
}
