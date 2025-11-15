import type { AppsV1Api, V1DaemonSet } from '@kubernetes/client-node'

import { getAppsV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformDaemonSetToDetail,
  transformDaemonSetToSummary,
} from '../transformers/daemonset'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { DaemonSetDetail, DaemonSetSummary } from '../types/daemonset'

/** 查询 DaemonSet 列表时可以指定命名空间和原生 QueryParams，以满足看板的过滤需求。 */
interface ListDaemonSetsOptions {
  /** namespace 对应 K8s 的 namespaced 列表接口，帮助看板聚焦某个租户的守护进程。 */
  namespace?: string
  /** params 复制所有 QueryParams，令 UI 的 label/field selector 直接转换为 Kubernetes 查询。 */
  params?: QueryParams
}

/** 控制是否在 DaemonSet 详情中附带 YAML 和原始对象的选项。 */
interface GetDaemonSetDetailOptions {
  /** includeRaw 打开后返回完整 V1DaemonSet，方便看板调试模式展示。 */
  includeRaw?: boolean
  /** includeYaml 告诉服务是否需要生成 toCleanYAML，用于 UI YAML 标签页。 */
  includeYaml?: boolean
}

const daemonSetService = createResourceService<
  AppsV1Api,
  V1DaemonSet,
  DaemonSetSummary,
  DaemonSetDetail,
  GetDaemonSetDetailOptions
>({
  resource: 'DaemonSet',
  getListClient: getAppsV1Api,
  listCall: {
    cluster: (client, params) => client.listDaemonSetForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedDaemonSet({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedDaemonSet({ namespace, name }),
  transformSummary: transformDaemonSetToSummary,
  transformDetail: transformDaemonSetToDetail,
})

/** 拉取 DaemonSet 列表并输出摘要，让可观测性看板渲染节点覆盖情况。 */
export async function listDaemonSets({
  namespace,
  params,
}: ListDaemonSetsOptions = {}): Promise<ListResponse<DaemonSetSummary>> {
  return daemonSetService.list({ namespace, params })
}

/** 获取单个 DaemonSet 的详情，供看板在工作负载页面上展开高级信息。 */
export async function getDaemonSetDetail(
  namespace: string,
  name: string,
  options: GetDaemonSetDetailOptions = {},
): Promise<DetailResponse<DaemonSetDetail, V1DaemonSet>> {
  return daemonSetService.getDetail(namespace, name, options)
}
