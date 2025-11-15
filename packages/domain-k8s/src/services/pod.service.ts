import type { CoreV1Api, V1Pod } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformPodToDetail,
  transformPodToSummary,
} from '../transformers/pod'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { PodDetail, PodSummary } from '../types/pod'

/**
 * 可观测性看板用来描述 Pod 列表请求的选项，字段直接映射 Kubernetes list API 的过滤能力。
 */
export interface ListPodsOptions {
  /** namespace 允许看板限定到某个命名空间，对应 K8s listNamespacedPod 的路径参数。 */
  namespace?: string
  /** params 挂载所有原生 QueryParams，让 UI 中的 label/field 选择器直达 Kubernetes。 */
  params?: QueryParams
}

/**
 * 控制 Pod 详情 API 的附加开关，让看板能按需请求 YAML 和原始对象。
 */
export interface GetPodDetailOptions {
  /** includeRaw 告诉服务端是否附带原生 V1Pod，便于看板在调试模式暴露完整 K8s 字段。 */
  includeRaw?: boolean
  /** includeYaml 允许调用方请求 YAML 版本，以便在 UI 中展示 kubectl 风格的视图。 */
  includeYaml?: boolean
}

const podService = createResourceService<
  CoreV1Api,
  V1Pod,
  PodSummary,
  PodDetail,
  GetPodDetailOptions
>({
  resource: 'Pod',
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) => client.listPodForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedPod({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedPod({ namespace, name }),
  transformSummary: transformPodToSummary,
  transformDetail: transformPodToDetail,
})

/**
 * 获取 Pod 列表，并将 Kubernetes 响应转换成看板使用的 PodSummary 列表。
 */
export async function listPods({
  namespace,
  params,
}: ListPodsOptions = {}): Promise<ListResponse<PodSummary>> {
  return podService.list({ namespace, params })
}

/**
 * 获取单个 Pod 的详情，并根据选项返回 YAML 或原始对象，支撑看板的调试面板。
 */
export async function getPodDetail(
  namespace: string,
  name: string,
  options: GetPodDetailOptions = {},
): Promise<DetailResponse<PodDetail, V1Pod>> {
  return podService.getDetail(namespace, name, options)
}
