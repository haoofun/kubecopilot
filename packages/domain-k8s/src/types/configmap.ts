/**
 * Minimal ConfigMap info so the observability board can tally configuration objects per namespace using Kubernetes metadata.
 */
export interface ConfigMapSummary {
  /** UID uniquely identifies the ConfigMap, mirroring `metadata.uid`. */
  uid: string
  /** name is displayed directly from `metadata.name`. */
  name: string
  /** namespace scopes the ConfigMap to a tenant, matching `metadata.namespace`. */
  namespace: string
  /** dataCount shows how many keys exist in `data`, hinting at config complexity. */
  dataCount: number
  /** creationTimestamp helps time-box configuration churn via `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Detailed ConfigMap view allowing ops to inspect metadata and keys when debugging workloads.
 */
export interface ConfigMapDetail extends ConfigMapSummary {
  /** labels, taken from `metadata.labels`, power owner/environment filters. */
  labels: Record<string, string>
  /** annotations bring in deployment metadata and git SHAs from `metadata.annotations`. */
  annotations: Record<string, string>
  /** data exposes text key-value pairs from the ConfigMap, letting the board show diff-friendly previews. */
  data: Record<string, string>
  /** binaryData mirrors the optional binary map so users know when non-text payloads exist. */
  binaryData: Record<string, string>
}
