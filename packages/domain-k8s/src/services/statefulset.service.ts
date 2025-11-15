import type { AppsV1Api, V1StatefulSet } from '@kubernetes/client-node'

import { getAppsV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformStatefulSetToDetail,
  transformStatefulSetToSummary,
} from '../transformers/statefulset'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type {
  StatefulSetDetail,
  StatefulSetSummary,
} from '../types/statefulset'

/**
 * StatefulSet 列表查询参数，用于让看板在命名空间或 label 维度过滤控制器。
 */
export interface ListStatefulSetsOptions {
  /** namespace 绑定到 Kubernetes 的 listNamespacedStatefulSet，帮助看板聚焦单租户。 */
  namespace?: string
  /** params 承载通用 QueryParams，使 UI 的 selector/分页直接作用于 Kubernetes API。 */
  params?: QueryParams
}

/**
 * 控制 StatefulSet 详情响应的附加信息开关。
 */
export interface GetStatefulSetDetailOptions {
  /** includeRaw 返回完整 V1StatefulSet，方便看板调试模式显示所有字段。 */
  includeRaw?: boolean
  /** includeYaml 决定是否附带 YAML，满足 SRE 在线 diff 的需求。 */
  includeYaml?: boolean
}

const statefulSetService = createResourceService<
  AppsV1Api,
  V1StatefulSet,
  StatefulSetSummary,
  StatefulSetDetail,
  GetStatefulSetDetailOptions
>({
  resource: 'StatefulSet',
  getListClient: getAppsV1Api,
  listCall: {
    cluster: (client, params) => client.listStatefulSetForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedStatefulSet({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedStatefulSet({ namespace, name }),
  transformSummary: transformStatefulSetToSummary,
  transformDetail: transformStatefulSetToDetail,
})

/**
 * 获取 StatefulSet 列表并输出标准化摘要供看板使用。
 */
export async function listStatefulSets({
  namespace,
  params,
}: ListStatefulSetsOptions = {}): Promise<ListResponse<StatefulSetSummary>> {
  return statefulSetService.list({ namespace, params })
}

/**
 * 获取 StatefulSet 详情，并按需携带 YAML 与原始对象给看板的详情面板。
 */
export async function getStatefulSetDetail(
  namespace: string,
  name: string,
  options: GetStatefulSetDetailOptions = {},
): Promise<DetailResponse<StatefulSetDetail, V1StatefulSet>> {
  return statefulSetService.getDetail(namespace, name, options)
}
