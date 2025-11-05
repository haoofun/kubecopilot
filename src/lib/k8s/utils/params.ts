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

const toOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }
  return String(value)
}

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
 * 将 QueryParams 映射为 K8s API 所需的列表调用参数。
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
 * 将 URLSearchParams 转换为 QueryParams。
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
