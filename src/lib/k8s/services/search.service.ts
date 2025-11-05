import { ApiError } from '@/lib/api/error'

import { listPods } from './pod.service'
import { listDeployments } from './deployment.service'
import { listServices } from './service.service'
import { listConfigMaps } from './configmap.service'
import { listNamespaces } from './namespace.service'
import { listNodes } from './node.service'
import type { QueryParams } from '../types/common'
import type { PodSummary } from '../types/pod'
import type { DeploymentSummary } from '../types/deployment'
import type { ServiceSummary } from '../types/service'
import type { ConfigMapSummary } from '../types/configmap'
import type { NamespaceSummary } from '../types/namespace'
import type { NodeSummary } from '../types/node'
import type { GlobalSearchResult } from '../types/search'

type SearchableSummary =
  | PodSummary
  | DeploymentSummary
  | ServiceSummary
  | ConfigMapSummary
  | NamespaceSummary
  | NodeSummary

interface SearchResourceConfig<T extends SearchableSummary> {
  kind: GlobalSearchResult['kind']
  list: (options?: { namespace?: string; params?: QueryParams }) => Promise<T[]>
  toResult: (item: T) => GlobalSearchResult
  extractSearchValues: (item: T) => Array<string | null | undefined>
  buildQueryOptions?: (
    query: string,
  ) => { namespace?: string; params?: QueryParams } | null
}

const DEFAULT_LIMIT_PER_RESOURCE = 25
const DEFAULT_TOTAL_LIMIT = 50
const MIN_QUERY_LENGTH = 2
const PARTIAL_QUERY_THRESHOLD = 3
const TARGETED_FETCH_LIMIT = 5
const CACHE_TTL_MS = 5_000
const RATE_LIMIT_WINDOW_MS = 5_000
const RATE_LIMIT_MAX_CALLS = 60

const searchCache = new Map<
  string,
  { items: GlobalSearchResult[]; expiresAt: number }
>()
const requestTimestamps: number[] = []

const buildCacheKey = (
  query: string,
  limitPerResource: number,
  totalLimit: number,
) => `${query}|${limitPerResource}|${totalLimit}`

const isLikelyResourceName = (value: string) =>
  /^[a-z0-9]([a-z0-9-.]*[a-z0-9])?$/i.test(value)

const parseNamespacedQuery = (value: string) => {
  const [maybeNamespace, maybeName] = value.split('/')
  if (!maybeName || !maybeNamespace) {
    return null
  }
  if (
    !isLikelyResourceName(maybeNamespace) ||
    !isLikelyResourceName(maybeName)
  ) {
    return null
  }

  return { namespace: maybeNamespace, name: maybeName }
}

const mergeSummaries = <T extends SearchableSummary>(
  current: T[],
  incoming: T[],
) => {
  const seen = new Set(current.map((item) => item.uid))
  for (const item of incoming) {
    if (!item.uid || seen.has(item.uid)) {
      continue
    }
    current.push(item)
    seen.add(item.uid)
  }
  return current
}

const enforceRateLimit = (now: number) => {
  requestTimestamps.push(now)
  while (
    requestTimestamps.length > 0 &&
    requestTimestamps[0] <= now - RATE_LIMIT_WINDOW_MS
  ) {
    requestTimestamps.shift()
  }

  if (requestTimestamps.length > RATE_LIMIT_MAX_CALLS) {
    console.warn(
      `[search] rate limit exceeded: ${requestTimestamps.length} requests in ${RATE_LIMIT_WINDOW_MS}ms`,
    )
    throw new ApiError(
      'Search rate limit exceeded. Please slow down.',
      429,
      'RATE_LIMIT',
    )
  }
}

const buildRequestParams = (
  params?: QueryParams,
  limitOverride?: number,
): QueryParams => {
  const nextParams: QueryParams = { ...(params ?? {}) }
  if (limitOverride !== undefined) {
    nextParams.limit = limitOverride
  } else if (nextParams.limit === undefined) {
    nextParams.limit = DEFAULT_LIMIT_PER_RESOURCE
  }
  return nextParams
}

const searchResourceConfigs: SearchResourceConfig<SearchableSummary>[] = [
  {
    kind: 'Pod',
    list: async ({ namespace, params } = {}) => {
      const requestParams = buildRequestParams(params)
      if (namespace) {
        return (await listPods({ namespace, params: requestParams })).items
      }
      return (await listPods({ params: requestParams })).items
    },
    toResult: (item) => {
      const pod = item as PodSummary
      return {
        kind: 'Pod',
        name: pod.name,
        namespace: pod.namespace,
        description: `Status ${pod.status} · Restarts ${pod.restarts}`,
        href: `/pods/${pod.namespace}/${pod.name}`,
        uid: pod.uid,
      }
    },
    extractSearchValues: (item) => {
      const pod = item as PodSummary
      return [pod.name, pod.namespace, pod.status]
    },
    buildQueryOptions: (query) => {
      const parsed = parseNamespacedQuery(query)
      if (parsed) {
        return {
          namespace: parsed.namespace,
          params: {
            fieldSelector: `metadata.name=${parsed.name}`,
          },
        }
      }
      if (!isLikelyResourceName(query)) {
        return null
      }
      return {
        params: {
          fieldSelector: `metadata.name=${query}`,
        },
      }
    },
  },
  {
    kind: 'Deployment',
    list: async ({ namespace, params } = {}) => {
      const requestParams = buildRequestParams(params)
      if (namespace) {
        return (await listDeployments({ namespace, params: requestParams }))
          .items
      }
      return (await listDeployments({ params: requestParams })).items
    },
    toResult: (item) => {
      const deployment = item as DeploymentSummary
      return {
        kind: 'Deployment',
        name: deployment.name,
        namespace: deployment.namespace,
        description: `Ready ${deployment.readyReplicas}/${deployment.desiredReplicas}`,
        href: `/deployments/${deployment.namespace}/${deployment.name}`,
        uid: deployment.uid,
      }
    },
    extractSearchValues: (item) => {
      const deployment = item as DeploymentSummary
      return [deployment.name, deployment.namespace]
    },
    buildQueryOptions: (query) => {
      const parsed = parseNamespacedQuery(query)
      if (parsed) {
        return {
          namespace: parsed.namespace,
          params: {
            fieldSelector: `metadata.name=${parsed.name}`,
          },
        }
      }
      if (!isLikelyResourceName(query)) {
        return null
      }
      return {
        params: {
          fieldSelector: `metadata.name=${query}`,
        },
      }
    },
  },
  {
    kind: 'Service',
    list: async ({ namespace, params } = {}) => {
      const requestParams = buildRequestParams(params)
      if (namespace) {
        return (await listServices({ namespace, params: requestParams })).items
      }
      return (await listServices({ params: requestParams })).items
    },
    toResult: (item) => {
      const service = item as ServiceSummary
      return {
        kind: 'Service',
        name: service.name,
        namespace: service.namespace,
        description: `${service.type} · ClusterIP ${service.clusterIP}`,
        href: `/services/${service.namespace}/${service.name}`,
        uid: service.uid,
      }
    },
    extractSearchValues: (item) => {
      const service = item as ServiceSummary
      return [
        service.name,
        service.namespace,
        service.clusterIP,
        service.type,
        ...(service.ports ?? []),
      ]
    },
    buildQueryOptions: (query) => {
      const parsed = parseNamespacedQuery(query)
      if (parsed) {
        return {
          namespace: parsed.namespace,
          params: {
            fieldSelector: `metadata.name=${parsed.name}`,
          },
        }
      }
      if (!isLikelyResourceName(query)) {
        return null
      }
      return {
        params: {
          fieldSelector: `metadata.name=${query}`,
        },
      }
    },
  },
  {
    kind: 'ConfigMap',
    list: async ({ namespace, params } = {}) => {
      const requestParams = buildRequestParams(params)
      if (namespace) {
        return (await listConfigMaps({ namespace, params: requestParams }))
          .items
      }
      return (await listConfigMaps({ params: requestParams })).items
    },
    toResult: (item) => {
      const configMap = item as ConfigMapSummary
      return {
        kind: 'ConfigMap',
        name: configMap.name,
        namespace: configMap.namespace,
        description: `${configMap.dataCount} data entries`,
        href: `/configmaps/${configMap.namespace}/${configMap.name}`,
        uid: configMap.uid,
      }
    },
    extractSearchValues: (item) => {
      const configMap = item as ConfigMapSummary
      return [configMap.name, configMap.namespace]
    },
    buildQueryOptions: (query) => {
      const parsed = parseNamespacedQuery(query)
      if (parsed) {
        return {
          namespace: parsed.namespace,
          params: {
            fieldSelector: `metadata.name=${parsed.name}`,
          },
        }
      }
      if (!isLikelyResourceName(query)) {
        return null
      }
      return {
        params: {
          fieldSelector: `metadata.name=${query}`,
        },
      }
    },
  },
  {
    kind: 'Namespace',
    list: async ({ params } = {}) => {
      const requestParams = buildRequestParams(params)
      return (await listNamespaces({ params: requestParams })).items
    },
    toResult: (item) => {
      const namespace = item as NamespaceSummary
      return {
        kind: 'Namespace',
        name: namespace.name,
        namespace: null,
        description: `Status ${namespace.status}`,
        href: `/namespaces/${namespace.name}`,
        uid: namespace.uid,
      }
    },
    extractSearchValues: (item) => {
      const namespace = item as NamespaceSummary
      return [namespace.name, namespace.status]
    },
    buildQueryOptions: (query) => {
      if (!isLikelyResourceName(query)) {
        return null
      }
      return {
        params: {
          fieldSelector: `metadata.name=${query}`,
        },
      }
    },
  },
  {
    kind: 'Node',
    list: async ({ params } = {}) => {
      const requestParams = buildRequestParams(params)
      return (await listNodes({ params: requestParams })).items
    },
    toResult: (item) => {
      const node = item as NodeSummary
      return {
        kind: 'Node',
        name: node.name,
        namespace: null,
        description: `${node.roles.join(', ') || 'No roles'} · Status ${node.status}`,
        href: `/nodes/${node.name}`,
        uid: node.uid,
      }
    },
    extractSearchValues: (item) => {
      const node = item as NodeSummary
      return [node.name, ...(node.roles ?? []), node.status]
    },
    buildQueryOptions: (query) => {
      if (!isLikelyResourceName(query)) {
        return null
      }
      return {
        params: {
          fieldSelector: `metadata.name=${query}`,
        },
      }
    },
  },
]

export async function searchK8sResources(
  rawQuery: string,
  options: { limitPerResource?: number; totalLimit?: number } = {},
): Promise<GlobalSearchResult[]> {
  const query = rawQuery.trim()
  if (query.length < MIN_QUERY_LENGTH) {
    return []
  }

  const now = Date.now()
  enforceRateLimit(now)

  const limitPerResource =
    options.limitPerResource ?? DEFAULT_LIMIT_PER_RESOURCE
  const totalLimit = options.totalLimit ?? DEFAULT_TOTAL_LIMIT
  const cacheKey = buildCacheKey(query, limitPerResource, totalLimit)
  const cached = searchCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.items.slice(0, totalLimit)
  }

  const normalized = query.toLowerCase()
  const targetedOnly = query.length < PARTIAL_QUERY_THRESHOLD

  const settled = await Promise.allSettled(
    searchResourceConfigs.map(async (config) => {
      const collected: SearchableSummary[] = []

      const targetedOptions = config.buildQueryOptions?.(query)
      if (targetedOptions) {
        const targetedParams = {
          ...targetedOptions,
          params: buildRequestParams(
            targetedOptions.params,
            Math.min(TARGETED_FETCH_LIMIT, limitPerResource),
          ),
        }
        try {
          const targetedItems = await config.list(targetedParams)
          mergeSummaries(collected, targetedItems)
        } catch (error) {
          console.debug(
            `[search] targeted fetch failed for ${config.kind}`,
            error,
          )
        }
      }

      if (!targetedOnly || collected.length === 0) {
        const fallbackParams = {
          params: buildRequestParams(undefined, limitPerResource),
        }
        const fallbackItems = await config.list(fallbackParams)
        mergeSummaries(collected, fallbackItems)
      }

      const matches = collected.filter((item) =>
        config
          .extractSearchValues(item)
          .some((value) =>
            (value ?? '').toString().toLowerCase().includes(normalized),
          ),
      )

      return matches.slice(0, limitPerResource).map(config.toResult)
    }),
  )

  const results: GlobalSearchResult[] = []

  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      for (const item of outcome.value) {
        results.push(item)
        if (results.length >= totalLimit) {
          const finalResults = results.slice(0, totalLimit)
          searchCache.set(cacheKey, {
            items: finalResults,
            expiresAt: now + CACHE_TTL_MS,
          })
          return finalResults
        }
      }
    } else {
      console.error('[search] resource search failed', outcome.reason)
    }
  }

  const finalResults = results.slice(0, totalLimit)
  searchCache.set(cacheKey, {
    items: finalResults,
    expiresAt: now + CACHE_TTL_MS,
  })
  return finalResults
}
