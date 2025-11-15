import type { CoreV1Api, V1ConfigMap } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformConfigMapToDetail,
  transformConfigMapToSummary,
} from '../transformers/configmap'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { ConfigMapDetail, ConfigMapSummary } from '../types/configmap'

/** ConfigMap 列表选项，支撑可观测性看板根据命名空间和 selectors 获取配置资源。 */
interface ListConfigMapsOptions {
  /** namespace 将查询限定在特定命名空间，对应 Kubernetes listNamespacedConfigMap。 */
  namespace?: string
  /** params 允许 UI 透传 QueryParams，以 label/field selector 方式过滤。 */
  params?: QueryParams
}

/** ConfigMap 详情附加开关，用于在 UI 中显示 YAML 或原始 JSON。 */
interface GetConfigMapDetailOptions {
  /** includeRaw 返回完整 V1ConfigMap 以供调试。 */
  includeRaw?: boolean
  /** includeYaml 指示是否生成 YAML，用于 UI 中的 manifest 视图。 */
  includeYaml?: boolean
}

const configMapService = createResourceService<
  CoreV1Api,
  V1ConfigMap,
  ConfigMapSummary,
  ConfigMapDetail,
  GetConfigMapDetailOptions
>({
  resource: 'ConfigMap',
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) => client.listConfigMapForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedConfigMap({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedConfigMap({ namespace, name }),
  transformSummary: transformConfigMapToSummary,
  transformDetail: transformConfigMapToDetail,
})

/** 列出 ConfigMap 并转化为摘要，供看板的配置面板展示。 */
export async function listConfigMaps({
  namespace,
  params,
}: ListConfigMapsOptions = {}): Promise<ListResponse<ConfigMapSummary>> {
  return configMapService.list({ namespace, params })
}

/** 读取单个 ConfigMap 的详情，为看板调试配置问题提供数据。 */
export async function getConfigMapDetail(
  namespace: string,
  name: string,
  options: GetConfigMapDetailOptions = {},
): Promise<DetailResponse<ConfigMapDetail, V1ConfigMap>> {
  return configMapService.getDetail(namespace, name, options)
}
