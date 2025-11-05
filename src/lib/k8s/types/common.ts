// lib/k8s/types/common.ts
export interface ListMetadata {
  total?: number
  continueToken?: string // 内部别名
  resourceVersion?: string // 用于 Watch 操作
}

export interface ListResponse<T> {
  items: T[]
  metadata: ListMetadata
}

export interface DetailResponse<TSummary, TRaw = unknown> {
  summary: TSummary
  yaml?: string
  raw?: TRaw // 原始K8s对象，便于调试或未来扩展
}

export type QueryParamValue = string | number | boolean | undefined

// 查询参数类型
export type QueryParams = Partial<{
  labelSelector: string
  fieldSelector: string
  limit: number
  continueToken: string // 内部别名
  watch: boolean
  allowWatchBookmarks: boolean
  resourceVersion: string
  resourceVersionMatch: string
  sendInitialEvents: boolean
  timeoutSeconds: number
  pretty: string
}> &
  Record<string, QueryParamValue>

/**
 * 代表一个对象的拥有者。
 * 用于追踪哪个控制器（如 ReplicaSet, Application）管理着当前资源。
 */
export interface OwnerReference {
  kind: string
  name: string
  uid: string
}

/**
 * 代表 Kubernetes 资源的状态条件。
 * 用于深入诊断资源为何处于当前状态。
 */
export interface Condition {
  type: string
  status: 'True' | 'False' | 'Unknown' | string
  reason: string
  message: string
  lastUpdateTime: string
}
