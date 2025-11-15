import type { NetworkingV1Api, V1Ingress } from '@kubernetes/client-node'

import { getNetworkingV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformIngressToDetail,
  transformIngressToSummary,
} from '../transformers/ingress'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { IngressDetail, IngressSummary } from '../types/ingress'

/** Ingress 列表选项，帮助看板根据命名空间和 selector 获取暴露入口。 */
interface ListIngressesOptions {
  /** namespace 限定 listNamespacedIngress 的作用域。 */
  namespace?: string
  /** params 承载 QueryParams，使 UI 的过滤条件传递到 Kubernetes。 */
  params?: QueryParams
}

/** Ingress 详情附加选项，选择是否返回 YAML/原始对象。 */
interface GetIngressDetailOptions {
  /** includeRaw 返回完整 V1Ingress 以供调试。 */
  includeRaw?: boolean
  /** includeYaml 生成可供 UI 展示的 YAML。 */
  includeYaml?: boolean
}

const ingressService = createResourceService<
  NetworkingV1Api,
  V1Ingress,
  IngressSummary,
  IngressDetail,
  GetIngressDetailOptions
>({
  resource: 'Ingress',
  getListClient: getNetworkingV1Api,
  listCall: {
    cluster: (client, params) => client.listIngressForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedIngress({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedIngress({ namespace, name }),
  transformSummary: transformIngressToSummary,
  transformDetail: transformIngressToDetail,
})

/** 列出 Ingress 资源并生成摘要，供网络暴露视图使用。 */
export async function listIngresses({
  namespace,
  params,
}: ListIngressesOptions = {}): Promise<ListResponse<IngressSummary>> {
  return ingressService.list({ namespace, params })
}

/** 获取 Ingress 详情，为看板展示 TLS、规则和后端映射提供数据。 */
export async function getIngressDetail(
  namespace: string,
  name: string,
  options: GetIngressDetailOptions = {},
): Promise<DetailResponse<IngressDetail, V1Ingress>> {
  return ingressService.getDetail(namespace, name, options)
}
