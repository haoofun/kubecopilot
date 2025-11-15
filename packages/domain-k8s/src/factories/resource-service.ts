import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'

export interface BaseDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
  [key: string]: unknown
}

type KubernetesListResponse<TResource> = {
  items?: TResource[]
  metadata?: {
    _continue?: string | null
    resourceVersion?: string | null
  }
}

interface SharedResourceServiceConfig<
  TApi,
  TResource,
  TSummary,
  TDetail,
  TDetailOptions extends BaseDetailOptions,
> {
  resource: string
  getListClient: () => Promise<TApi>
  getDetailClient?: () => Promise<TApi>
  transformSummary: (resource: TResource) => TSummary
  transformDetail: (resource: TResource) => TDetail
  buildListParams?: (params?: QueryParams) => Record<string, unknown>
  toYaml?: (resource: TResource) => string
  toRaw?: (resource: TResource) => unknown
  defaultDetailOptions?: Partial<TDetailOptions>
  extendDetail?: (context: {
    apiClient: TApi
    resource: TResource
    detail: TDetail
    options: TDetailOptions
  }) => Promise<void> | void
}

export interface NamespacedResourceServiceConfig<
  TApi,
  TResource,
  TSummary,
  TDetail,
  TDetailOptions extends BaseDetailOptions = BaseDetailOptions,
> extends SharedResourceServiceConfig<
    TApi,
    TResource,
    TSummary,
    TDetail,
    TDetailOptions
  > {
  namespaced?: true
  listCall: {
    cluster: (
      client: TApi,
      params: Record<string, unknown>,
    ) => Promise<KubernetesListResponse<TResource>>
    namespaced: (
      client: TApi,
      namespace: string,
      params: Record<string, unknown>,
    ) => Promise<KubernetesListResponse<TResource>>
  }
  read: (client: TApi, namespace: string, name: string) => Promise<TResource>
}

export interface ClusterResourceServiceConfig<
  TApi,
  TResource,
  TSummary,
  TDetail,
  TDetailOptions extends BaseDetailOptions = BaseDetailOptions,
> extends SharedResourceServiceConfig<
    TApi,
    TResource,
    TSummary,
    TDetail,
    TDetailOptions
  > {
  namespaced: false
  listCall: {
    cluster: (
      client: TApi,
      params: Record<string, unknown>,
    ) => Promise<KubernetesListResponse<TResource>>
  }
  read: (client: TApi, name: string) => Promise<TResource>
}

export interface NamespacedResourceService<
  TSummary,
  TDetail,
  TRaw,
  TDetailOptions extends BaseDetailOptions,
> {
  namespaced: true
  list: (options?: {
    namespace?: string
    params?: QueryParams
  }) => Promise<ListResponse<TSummary>>
  getDetail: (
    namespace: string,
    name: string,
    options?: TDetailOptions,
  ) => Promise<DetailResponse<TDetail, TRaw>>
}

export interface ClusterResourceService<
  TSummary,
  TDetail,
  TRaw,
  TDetailOptions extends BaseDetailOptions,
> {
  namespaced: false
  list: (options?: { params?: QueryParams }) => Promise<ListResponse<TSummary>>
  getDetail: (
    name: string,
    options?: TDetailOptions,
  ) => Promise<DetailResponse<TDetail, TRaw>>
}

function isClusterConfig<
  TApi,
  TResource,
  TSummary,
  TDetail,
  TDetailOptions extends BaseDetailOptions,
>(
  config:
    | NamespacedResourceServiceConfig<
        TApi,
        TResource,
        TSummary,
        TDetail,
        TDetailOptions
      >
    | ClusterResourceServiceConfig<
        TApi,
        TResource,
        TSummary,
        TDetail,
        TDetailOptions
      >,
): config is ClusterResourceServiceConfig<
  TApi,
  TResource,
  TSummary,
  TDetail,
  TDetailOptions
> {
  return config.namespaced === false
}

function buildMetadata(metadata?: {
  _continue?: string | null
  resourceVersion?: string | null
}): ListResponse<unknown>['metadata'] {
  return {
    continueToken: metadata?._continue ?? undefined,
    resourceVersion: metadata?.resourceVersion ?? undefined,
  }
}

export function createResourceService<
  TApi,
  TResource,
  TSummary,
  TDetail,
  TDetailOptions extends BaseDetailOptions = BaseDetailOptions,
>(
  config:
    | NamespacedResourceServiceConfig<
        TApi,
        TResource,
        TSummary,
        TDetail,
        TDetailOptions
      >
    | ClusterResourceServiceConfig<
        TApi,
        TResource,
        TSummary,
        TDetail,
        TDetailOptions
      >,
):
  | NamespacedResourceService<TSummary, TDetail, TResource, TDetailOptions>
  | ClusterResourceService<TSummary, TDetail, TResource, TDetailOptions> {
  const buildParams =
    config.buildListParams ??
    ((params?: QueryParams) => buildListCallParams(params))
  const getYaml =
    config.toYaml ?? ((resource: TResource) => toCleanYAML(resource as never))
  const getRaw =
    config.toRaw ?? ((resource: TResource) => toSerializable(resource))

  const getDetailOptions = (options?: TDetailOptions): TDetailOptions => {
    return {
      includeRaw: false,
      includeYaml: false,
      ...(config.defaultDetailOptions as object),
      ...(options as object),
    } as TDetailOptions
  }

  if (isClusterConfig(config)) {
    const clusterService: ClusterResourceService<
      TSummary,
      TDetail,
      TResource,
      TDetailOptions
    > = {
      namespaced: false as const,
      async list({ params }: { params?: QueryParams } = {}) {
        const client = await config.getListClient()
        const requestParams = buildParams(params)
        const response = await config.listCall.cluster(client, requestParams)
        const items = response.items?.map(config.transformSummary) ?? []
        return {
          items,
          metadata: buildMetadata(response.metadata),
        }
      },
      async getDetail(name: string, options?: TDetailOptions) {
        const detailOptions = getDetailOptions(options)
        const client = await (config.getDetailClient
          ? config.getDetailClient()
          : config.getListClient())
        const resource = await config.read(client, name)
        const detail = config.transformDetail(resource)
        if (config.extendDetail) {
          await config.extendDetail({
            apiClient: client,
            resource,
            detail,
            options: detailOptions,
          })
        }
        return {
          summary: detail,
          yaml: detailOptions.includeYaml ? getYaml(resource) : undefined,
          raw: detailOptions.includeRaw ? getRaw(resource) : undefined,
        }
      },
    }
    return clusterService
  }

  const namespacedService: NamespacedResourceService<
    TSummary,
    TDetail,
    TResource,
    TDetailOptions
  > = {
    namespaced: true as const,
    async list({
      namespace,
      params,
    }: {
      namespace?: string
      params?: QueryParams
    } = {}) {
      const client = await config.getListClient()
      const requestParams = buildParams(params)
      const response = namespace
        ? await config.listCall.namespaced(client, namespace, {
            ...requestParams,
          })
        : await config.listCall.cluster(client, requestParams)
      const items = response.items?.map(config.transformSummary) ?? []
      return {
        items,
        metadata: buildMetadata(response.metadata),
      }
    },
    async getDetail(namespace: string, name: string, options?: TDetailOptions) {
      const detailOptions = getDetailOptions(options)
      const client = await (config.getDetailClient
        ? config.getDetailClient()
        : config.getListClient())
      const resource = await config.read(client, namespace, name)
      const detail = config.transformDetail(resource)
      if (config.extendDetail) {
        await config.extendDetail({
          apiClient: client,
          resource,
          detail,
          options: detailOptions,
        })
      }
      return {
        summary: detail,
        yaml: detailOptions.includeYaml ? getYaml(resource) : undefined,
        raw: detailOptions.includeRaw ? getRaw(resource) : undefined,
      }
    },
  }

  return namespacedService
}
