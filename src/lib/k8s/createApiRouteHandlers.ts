import { NextRequest } from 'next/server'
import { NotFoundError, ValidationError } from '@infra-http/error'
import { createDataResponse, createErrorResponse } from '@infra-http/response'

import type {
  ClusterResourceService,
  NamespacedResourceService,
} from '@domain-k8s/factories/resource-service'
import { listEventsForResource } from '@domain-k8s/services/event.service'
import {
  extractQueryParams,
  parseOptionalBoolean,
} from '@domain-k8s/utils/params'
import type { QueryParams } from '@domain-k8s/types/common'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'

type RouteParams = {
  path?: string[]
}

type DetailOptionsParser<TDetailOptions> = (
  searchParams: URLSearchParams,
) => TDetailOptions

export interface CreateApiRouteHandlersConfig<TDetailOptions> {
  resourceBase: string
  kind: string
  telemetry: {
    route: string
    category: string
  }
  service:
    | NamespacedResourceService<unknown, unknown, unknown, TDetailOptions>
    | ClusterResourceService<unknown, unknown, unknown, TDetailOptions>
  parseDetailOptions?: DetailOptionsParser<TDetailOptions>
  detailQueryKeys?: string[]
  enableEvents?: boolean
}

const DEFAULT_DETAIL_KEYS = ['includeRaw', 'includeYaml']

const defaultDetailParser = (
  searchParams: URLSearchParams,
): { includeRaw?: boolean; includeYaml?: boolean } => ({
  includeRaw: parseOptionalBoolean(
    searchParams.get('includeRaw') ?? searchParams.get('raw'),
  ),
  includeYaml: parseOptionalBoolean(searchParams.get('includeYaml')),
})

const buildQueryParams = (
  searchParams: URLSearchParams,
  exclude: Set<string>,
): QueryParams | undefined => {
  const params = extractQueryParams(searchParams, exclude)
  return Object.keys(params).length > 0 ? params : undefined
}

export function createApiRouteHandlers<TDetailOptions = Record<string, never>>(
  config: CreateApiRouteHandlersConfig<TDetailOptions>,
) {
  const { service } = config
  const detailKeys = new Set([
    ...DEFAULT_DETAIL_KEYS,
    ...(config.detailQueryKeys ?? []),
  ])
  const parseDetailOptions: DetailOptionsParser<TDetailOptions> =
    config.parseDetailOptions ??
    (defaultDetailParser as DetailOptionsParser<TDetailOptions>)

  const handleGet = async (
    request: NextRequest,
    context: { params: Promise<RouteParams> },
  ): Promise<Response> => {
    const { path = [] } = await context.params
    const segments = path ?? []
    const searchParams = request.nextUrl.searchParams

    try {
      if (service.namespaced) {
        return await handleNamespacedRequest(
          segments,
          searchParams,
          config,
          parseDetailOptions,
        )
      }
      return await handleClusterRequest(
        segments,
        searchParams,
        config,
        parseDetailOptions,
      )
    } catch (error) {
      return createErrorResponse(error, config.resourceBase)
    }
  }

  return {
    GET: withApiTelemetry(config.telemetry, handleGet),
  }

  async function handleNamespacedRequest(
    segments: string[],
    searchParams: URLSearchParams,
    cfg: CreateApiRouteHandlersConfig<TDetailOptions>,
    parser: DetailOptionsParser<TDetailOptions>,
  ) {
    const namespacedService = cfg.service as NamespacedResourceService<
      unknown,
      unknown,
      unknown,
      TDetailOptions
    >
    if (segments.length === 0) {
      const params = buildQueryParams(searchParams, detailKeys)
      const result = await namespacedService.list({ params })
      return createDataResponse(result)
    }

    if (segments.length === 1) {
      const [namespace] = segments
      const params = buildQueryParams(searchParams, detailKeys)
      const result = await namespacedService.list({ namespace, params })
      return createDataResponse(result)
    }

    if (segments.length === 2) {
      const [namespace, name] = segments
      const detailOptions = parser(searchParams)
      const result = await namespacedService.getDetail(
        namespace,
        name,
        detailOptions,
      )
      return createDataResponse(result)
    }

    if (segments.length === 3 && segments[2] === 'events') {
      if (cfg.enableEvents === false) {
        throw new NotFoundError(`${cfg.kind} events not available`)
      }
      const [namespace] = segments
      return handleEventsRequest(searchParams, cfg, detailKeys, namespace)
    }

    throw new NotFoundError(`${cfg.kind} resource path`)
  }

  async function handleClusterRequest(
    segments: string[],
    searchParams: URLSearchParams,
    cfg: CreateApiRouteHandlersConfig<TDetailOptions>,
    parser: DetailOptionsParser<TDetailOptions>,
  ) {
    const clusterService = cfg.service as ClusterResourceService<
      unknown,
      unknown,
      unknown,
      TDetailOptions
    >

    if (segments.length === 0) {
      const params = buildQueryParams(searchParams, detailKeys)
      const result = await clusterService.list({ params })
      return createDataResponse(result)
    }

    if (segments.length === 1) {
      const [name] = segments
      const detailOptions = parser(searchParams)
      const result = await clusterService.getDetail(name, detailOptions)
      return createDataResponse(result)
    }

    if (segments.length === 2 && segments[1] === 'events') {
      if (cfg.enableEvents === false) {
        throw new NotFoundError(`${cfg.kind} events not available`)
      }
      return handleEventsRequest(searchParams, cfg, detailKeys)
    }

    throw new NotFoundError(`${cfg.kind} resource path`)
  }

  async function handleEventsRequest(
    searchParams: URLSearchParams,
    cfg: CreateApiRouteHandlersConfig<TDetailOptions>,
    detailExclude: Set<string>,
    namespace?: string,
  ) {
    const uid = searchParams.get('uid') ?? undefined
    const nameParam = searchParams.get('name') ?? undefined

    if (!uid && !nameParam) {
      throw new ValidationError(
        `Missing identifier for ${cfg.kind} events lookup`,
        {
          uid: 'Provide uid or name',
        },
      )
    }

    const params = buildQueryParams(
      searchParams,
      new Set([...detailExclude, 'uid', 'name']),
    )
    const result = await listEventsForResource({
      namespace,
      uid,
      name: nameParam,
      kind: cfg.kind,
      params,
    })
    return createDataResponse(result)
  }
}
