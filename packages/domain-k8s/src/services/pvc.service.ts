import type {
  CoreV1Api,
  V1PersistentVolumeClaim,
} from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformPVCToDetail,
  transformPVCToSummary,
} from '../transformers/pvc'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { PVCDetail, PVCSummary } from '../types/pvc'

/** PVC 列表请求选项，帮助看板定位命名空间级存储需求。 */
interface ListPVCsOptions {
  /** namespace 与 listNamespacedPersistentVolumeClaim 对应，用于聚焦单租户。 */
  namespace?: string
  /** params 托管 QueryParams，使 UI 过滤条件传递给 Kubernetes。 */
  params?: QueryParams
}

/** PVC 详情附加开关，决定是否附带 YAML/原始对象。 */
interface GetPVCDetailOptions {
  /** includeRaw 使调用方得到完整 V1PersistentVolumeClaim 对象。 */
  includeRaw?: boolean
  /** includeYaml 呈现 YAML 以方便在看板中复制。 */
  includeYaml?: boolean
}

const pvcService = createResourceService<
  CoreV1Api,
  V1PersistentVolumeClaim,
  PVCSummary,
  PVCDetail,
  GetPVCDetailOptions
>({
  resource: 'PersistentVolumeClaim',
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) =>
      client.listPersistentVolumeClaimForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedPersistentVolumeClaim({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedPersistentVolumeClaim({ namespace, name }),
  transformSummary: transformPVCToSummary,
  transformDetail: transformPVCToDetail,
})

/** 列出 PVC 并转换为摘要，供可观测性看板的存储视图使用。 */
export async function listPVCs({
  namespace,
  params,
}: ListPVCsOptions = {}): Promise<ListResponse<PVCSummary>> {
  return pvcService.list({ namespace, params })
}

/** 获取 PVC 详情，为看板提供具体存储请求与状态。 */
export async function getPVCDetail(
  namespace: string,
  name: string,
  options: GetPVCDetailOptions = {},
): Promise<DetailResponse<PVCDetail, V1PersistentVolumeClaim>> {
  return pvcService.getDetail(namespace, name, options)
}
