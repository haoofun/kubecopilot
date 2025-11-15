import type { CoreV1Api, V1Endpoints, V1Service } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformServiceToDetail,
  transformServiceToSummary,
} from '../transformers/service'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { ServiceDetail, ServiceSummary } from '../types/service'

/**
 * Service 列表查询参数，帮助可观测性看板将命名空间和 label selector 直接映射到 Kubernetes API。
 */
export interface ListServicesOptions {
  /** namespace 约束 listNamespacedService 的作用域，让看板聚焦某个租户的入口资源。 */
  namespace?: string
  /** params 承载 QueryParams，使 UI 中的过滤条件传到 Kubernetes。 */
  params?: QueryParams
}

/**
 * 控制 Service 详情额外载荷（Endpoints、YAML、原始对象）的选项。
 */
export interface GetServiceDetailOptions {
  /** includeEndpoints 决定是否查询并附带 V1Endpoints，便于看板展示真实后端。 */
  includeEndpoints?: boolean
  /** includeRaw 让调试视图拿到完整 V1Service。 */
  includeRaw?: boolean
  /** includeYaml 告诉服务端是否生成 YAML 供 UI 渲染。 */
  includeYaml?: boolean
}

const serviceService = createResourceService<
  CoreV1Api,
  V1Service,
  ServiceSummary,
  ServiceDetail,
  GetServiceDetailOptions
>({
  resource: 'Service',
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) => client.listServiceForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedService({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedService({ namespace, name }),
  transformSummary: transformServiceToSummary,
  transformDetail: (service) => transformServiceToDetail(service),
  defaultDetailOptions: {
    includeEndpoints: true,
  },
  extendDetail: async ({ apiClient, resource, detail, options }) => {
    if (!options.includeEndpoints) {
      detail.endpoints = []
      return
    }
    const namespace = resource.metadata?.namespace
    const name = resource.metadata?.name
    if (!namespace || !name) {
      detail.endpoints = []
      return
    }
    let endpoints: V1Endpoints | null = null
    try {
      endpoints = await apiClient.readNamespacedEndpoints({ namespace, name })
    } catch {
      endpoints = null
    }
    detail.endpoints = transformServiceToDetail(resource, endpoints).endpoints
  },
})

/**
 * 获取 Service 列表并转换成 ServiceSummary，让看板网络页展示所有暴露面。
 */
export async function listServices({
  namespace,
  params,
}: ListServicesOptions = {}): Promise<ListResponse<ServiceSummary>> {
  return serviceService.list({ namespace, params })
}

/**
 * 获取 Service 详情，包含可选的 Endpoints、YAML 与原始对象，为网络拓扑视图提供数据。
 */
export async function getServiceDetail(
  namespace: string,
  name: string,
  options: GetServiceDetailOptions = {},
): Promise<DetailResponse<ServiceDetail, V1Service>> {
  return serviceService.getDetail(namespace, name, options)
}
