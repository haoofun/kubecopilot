// lib/k8s/types/common.ts
/**
 * Metadata that lets the observability board paginate and correlate K8s API list calls with watch streams.
 */
export interface ListMetadata {
  /** Observability needs the total count to show backlog trends; in K8s this is the `remainingItemCount` surfaced via list metadata. */
  total?: number
  /** Continue tokens help the board fetch the next chunk of a list; they map to `metadata._continue` in Kubernetes list responses. */
  continueToken?: string // 内部别名
  /** Resource versions anchor watch cursors on the board; they mirror `metadata.resourceVersion` so delta streams stay consistent. */
  resourceVersion?: string // 用于 Watch 操作
}

/**
 * Normalized list response so dashboards can consume typed resources plus paging metadata from the Kubernetes API.
 */
export interface ListResponse<T> {
  /** Observability renders each resource row from this collection; it corresponds to the `items` array returned by Kubernetes. */
  items: T[]
  /** Paging metadata from the API, used to drive streaming refresh widgets on the dashboard. */
  metadata: ListMetadata
}

/**
 * Detail response that pairs a curated summary of a resource with optional raw payloads for drill-down tooling.
 */
export interface DetailResponse<TSummary, TRaw = unknown> {
  /** The board shows this summary first because it condenses the resource's salient health metrics derived from Kubernetes. */
  summary: TSummary
  /** YAML snapshots let SREs diff manifests directly inside the observability experience; this string is the manifest emitted by Kubernetes. */
  yaml?: string
  /** Raw resources are preserved so power users can inspect the native Kubernetes object if the summarized view omits a field. */
  raw?: TRaw // 原始K8s对象，便于调试或未来扩展
}

/** Primitive query param values accepted by Kubernetes list/watch calls and surfaced in the observability filter UI. */
export type QueryParamValue = string | number | boolean | undefined

// 查询参数类型
/**
 * All optional query parameters that the board can pass along to Kubernetes list/watch calls to scope what operators observe.
 */
export type QueryParams = Partial<{
  /** The board pipes namespace/label filters into `labelSelector` so K8s does the heavy lifting server side. */
  labelSelector: string
  /** `fieldSelector` lets SREs filter by pod/node names directly from the UI; Kubernetes matches on resource fields. */
  fieldSelector: string
  /** limit drives pagination size on the board, backing the K8s `limit` query param. */
  limit: number
  /** continueToken keeps infinite-scroll lists synced with the API via `continue` tokens from Kubernetes. */
  continueToken: string // 内部别名
  /** watch toggles streaming updates; it's the direct boolean flag Kubernetes expects for watch endpoints. */
  watch: boolean
  /** allowWatchBookmarks indicates whether bookmarks should be surfaced, mirroring the Kubernetes feature gate to reduce missed events. */
  allowWatchBookmarks: boolean
  /** resourceVersion anchors incremental updates so the dashboard can show "up to version X" like kubectl. */
  resourceVersion: string
  /** resourceVersionMatch instructs the API which matching semantics to use (e.g., `NotOlderThan`) and keeps the board's view consistent. */
  resourceVersionMatch: string
  /** sendInitialEvents feeds existing state before streaming, mirroring the Kubernetes option to warm up UI tables. */
  sendInitialEvents: boolean
  /** timeoutSeconds configures how long Kubernetes should keep the watch open, controlling refresh cadence in the UI. */
  timeoutSeconds: number
  /** pretty is forwarded so diagnostics can request human-readable JSON, matching kubectl's `?pretty=1`. */
  pretty: string
}> &
  Record<string, QueryParamValue>

/**
 * 代表一个对象的拥有者。
 * 用于追踪哪个控制器（如 ReplicaSet, Application）管理着当前资源。
 */
export interface OwnerReference {
  /** Observability tags each resource with the owning controller; this mirrors the `kind` field inside `metadata.ownerReferences`. */
  kind: string
  /** Showing the controller's name reveals which workload emitted the pod; it maps to `metadata.ownerReferences[].name`. */
  name: string
  /** UID ensures deduplication even if names are reused; it's the immutable `metadata.ownerReferences[].uid` from Kubernetes. */
  uid: string
}

/**
 * 代表 Kubernetes 资源的状态条件。
 * 用于深入诊断资源为何处于当前状态。
 */
export interface Condition {
  /** Condition type drives which badge the board renders (Ready, Available, etc.); it matches `status.conditions[].type`. */
  type: string
  /** status differentiates Healthy/Degraded states in the UI; in Kubernetes it's `status.conditions[].status` (True/False/Unknown). */
  status: 'True' | 'False' | 'Unknown' | string
  /** reason strings help summarize why a condition flipped; the data comes from `status.conditions[].reason`. */
  reason: string
  /** message offers human-readable context shown in tooltips; it maps to `status.conditions[].message`. */
  message: string
  /** lastUpdateTime powers sparkline markers indicating when the condition last changed; it maps to the same-named Kubernetes timestamp. */
  lastUpdateTime: string
}
