import type { BatchV1Api, V1CronJob } from '@kubernetes/client-node'

import { getBatchV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformCronJobToSummary,
  transformCronJobToDetail,
} from '../transformers/cronjob'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { CronJobDetail, CronJobSummary } from '../types/cronjob'

/** CronJob 列表选项，供看板基于命名空间或 selectors 搜索计划任务。 */
interface ListCronJobsOptions {
  /** namespace 对应 listNamespacedCronJob 的作用域，方便查看单租户调度。 */
  namespace?: string
  /** params 透传 QueryParams，支持 label/field selector 过滤。 */
  params?: QueryParams
}

/** CronJob 详情开关，控制是否返回 YAML 与原生对象。 */
interface GetCronJobDetailOptions {
  /** includeRaw 输出完整 V1CronJob 供调试使用。 */
  includeRaw?: boolean
  /** includeYaml 呈现 YAML manifest，帮助看板展示排程配置。 */
  includeYaml?: boolean
}

const cronJobService = createResourceService<
  BatchV1Api,
  V1CronJob,
  CronJobSummary,
  CronJobDetail,
  GetCronJobDetailOptions
>({
  resource: 'CronJob',
  getListClient: getBatchV1Api,
  listCall: {
    cluster: (client, params) => client.listCronJobForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedCronJob({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedCronJob({ namespace, name }),
  transformSummary: transformCronJobToSummary,
  transformDetail: transformCronJobToDetail,
})

/** 列出 CronJob 并转换为摘要，支撑看板的调度任务面板。 */
export async function listCronJobs({
  namespace,
  params,
}: ListCronJobsOptions = {}): Promise<ListResponse<CronJobSummary>> {
  return cronJobService.list({ namespace, params })
}

/** 获取 CronJob 详情，为看板展示调度策略、历史和条件提供支撑。 */
export async function getCronJobDetail(
  namespace: string,
  name: string,
  options: GetCronJobDetailOptions = {},
): Promise<DetailResponse<CronJobDetail, V1CronJob>> {
  return cronJobService.getDetail(namespace, name, options)
}
