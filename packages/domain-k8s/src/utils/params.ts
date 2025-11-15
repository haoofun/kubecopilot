// lib/k8s/utils/params.ts
import type { QueryParamValue, QueryParams } from '../types/common'

export interface ListCallParams {
  allowWatchBookmarks?: boolean
  _continue?: string
  fieldSelector?: string
  labelSelector?: string
  limit?: number
  pretty?: string
  resourceVersion?: string
  resourceVersionMatch?: string
  sendInitialEvents?: boolean
  timeoutSeconds?: number
  watch?: boolean
}

/** Normalizes unknown values to strings so observability filters map cleanly onto Kubernetes list params. */
const toOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }
  return String(value)
}

/** Converts query inputs into numbers that the board forwards to Kubernetes for pagination/timeouts. */
const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

/** Parses boolean-like inputs so watch toggles in the UI hit the Kubernetes API with valid booleans. */
const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }

  return undefined
}

/**
 * 将 QueryParams 映射为 K8s API 所需的列表调用参数，让可观测性看板把筛选条件安全地传递给 Kubernetes。
 */
export function buildListCallParams(params?: QueryParams): ListCallParams {
  if (!params) {
    return {}
  }

  return {
    allowWatchBookmarks: toOptionalBoolean(params.allowWatchBookmarks),
    _continue: toOptionalString(params.continueToken),
    fieldSelector: toOptionalString(params.fieldSelector),
    labelSelector: toOptionalString(params.labelSelector),
    limit: toOptionalNumber(params.limit),
    pretty: toOptionalString(params.pretty),
    resourceVersion: toOptionalString(params.resourceVersion),
    resourceVersionMatch: toOptionalString(params.resourceVersionMatch),
    sendInitialEvents: toOptionalBoolean(params.sendInitialEvents),
    timeoutSeconds: toOptionalNumber(params.timeoutSeconds),
    watch: toOptionalBoolean(params.watch),
  }
}

export const listParamHelpers = {
  toOptionalString,
  toOptionalNumber,
  toOptionalBoolean,
}

const BOOLEAN_KEYS = new Set<string>([
  'allowWatchBookmarks',
  'sendInitialEvents',
  'watch',
])

const NUMERIC_KEYS = new Set<string>(['limit', 'timeoutSeconds'])

/**
 * 将 URLSearchParams 转换为 QueryParams，使看板上的 URL 筛选能还原为 Kubernetes 原生命令。
 */
export function extractQueryParams(
  searchParams: URLSearchParams,
  exclude: Iterable<string> = [],
): QueryParams {
  const excluded = new Set(exclude)
  const result: Record<string, QueryParamValue> = {}

  searchParams.forEach((value, key) => {
    if (excluded.has(key)) {
      return
    }

    if (value === '') {
      result[key] = ''
      return
    }

    if (BOOLEAN_KEYS.has(key)) {
      result[key] = value === 'true' || value === '1'
      return
    }

    if (NUMERIC_KEYS.has(key)) {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) {
        result[key] = parsed
        return
      }
    }

    result[key] = value
  })

  return result
}

/**
 * 解析布尔型查询参数，确保看板在构造 Kubernetes watch/list 请求时不丢失用户勾选状态。
 */
export function parseOptionalBoolean(
  value: string | null,
): boolean | undefined {
  if (value === null) {
    return undefined
  }

  if (value === 'true' || value === '1') {
    return true
  }

  if (value === 'false' || value === '0') {
    return false
  }

  return undefined
}
