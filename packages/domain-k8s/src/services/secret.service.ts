import type { CoreV1Api, V1Secret } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformSecretToDetail,
  transformSecretToSummary,
} from '../transformers/secret'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { SecretDetail, SecretSummary } from '../types/secret'

/** Secret 列表请求选项，帮助看板按命名空间或 selector 拉取凭证。 */
interface ListSecretsOptions {
  /** namespace 与 Kubernetes listNamespacedSecret 对齐，使多租户视图精准。 */
  namespace?: string
  /** params 承载 QueryParams，允许 UI 的过滤条件传递到 API。 */
  params?: QueryParams
}

/** Secret 详情开关，用于是否附带 YAML 或原始对象。 */
interface GetSecretDetailOptions {
  /** includeRaw 让调用方获取完整 V1Secret 以便调试。 */
  includeRaw?: boolean
  /** includeYaml 让 UI 呈现 toCleanYAML 结果。 */
  includeYaml?: boolean
}

const secretService = createResourceService<
  CoreV1Api,
  V1Secret,
  SecretSummary,
  SecretDetail,
  GetSecretDetailOptions
>({
  resource: 'Secret',
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) => client.listSecretForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedSecret({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedSecret({ namespace, name }),
  transformSummary: transformSecretToSummary,
  transformDetail: transformSecretToDetail,
})

/** 列出 Secret 并生成摘要，便于可观测性看板统计敏感配置。 */
export async function listSecrets({
  namespace,
  params,
}: ListSecretsOptions = {}): Promise<ListResponse<SecretSummary>> {
  return secretService.list({ namespace, params })
}

/** 获取 Secret 详情，供看板在敏感配置面板中展示关键信息。 */
export async function getSecretDetail(
  namespace: string,
  name: string,
  options: GetSecretDetailOptions = {},
): Promise<DetailResponse<SecretDetail, V1Secret>> {
  return secretService.getDetail(namespace, name, options)
}
