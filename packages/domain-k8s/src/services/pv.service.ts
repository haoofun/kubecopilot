import type { CoreV1Api, V1PersistentVolume } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import { transformPVToDetail, transformPVToSummary } from '../transformers/pv'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { PVDetail, PVSummary } from '../types/pv'

/** PV 列表请求选项，允许可观测性看板传入 Kubernetes QueryParams。 */
interface ListPVsOptions {
  /** params 对齐 listPersistentVolume 的查询参数（如 limit、continue）。 */
  params?: QueryParams
}

/** PV 详情开关，指定是否回传 YAML 或原始对象。 */
interface GetPVDetailOptions {
  /** includeRaw 返回完整 V1PersistentVolume，支持调试场景。 */
  includeRaw?: boolean
  /** includeYaml 允许 UI 显示 YAML。 */
  includeYaml?: boolean
}

const pvService = createResourceService<
  CoreV1Api,
  V1PersistentVolume,
  PVSummary,
  PVDetail,
  GetPVDetailOptions
>({
  resource: 'PersistentVolume',
  namespaced: false,
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) => client.listPersistentVolume(params),
  },
  read: (client, name) => client.readPersistentVolume({ name }),
  transformSummary: transformPVToSummary,
  transformDetail: transformPVToDetail,
})

/** 获取集群 PV 列表并转为摘要，供存储视图展示。 */
export async function listPVs({ params }: ListPVsOptions = {}): Promise<
  ListResponse<PVSummary>
> {
  return pvService.list({ params })
}

/** 读取 PV 详情，为看板提供存储资源的深度信息。 */
export async function getPVDetail(
  name: string,
  options: GetPVDetailOptions = {},
): Promise<DetailResponse<PVDetail, V1PersistentVolume>> {
  return pvService.getDetail(name, options)
}
