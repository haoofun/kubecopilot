import type { BatchV1Api, V1Job } from '@kubernetes/client-node'

import { getBatchV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformJobToDetail,
  transformJobToSummary,
} from '../transformers/job'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { JobDetail, JobSummary } from '../types/job'

/** Job 列表选项，提供命名空间和 QueryParams 以支撑看板的批处理视图。 */
interface ListJobsOptions {
  /** namespace 将查询限定在某个 tenant，对应 Kubernetes listNamespacedJob。 */
  namespace?: string
  /** params 传入 label/field selector 及分页设置，原样传到 Kubernetes。 */
  params?: QueryParams
}

/** Job 详情选项，控制是否附带 YAML 与原始对象。 */
interface GetJobDetailOptions {
  /** includeRaw 返回完整的 V1Job，便于调试。 */
  includeRaw?: boolean
  /** includeYaml 将 manifest 以 YAML 形式返回给前端。 */
  includeYaml?: boolean
}

const jobService = createResourceService<
  BatchV1Api,
  V1Job,
  JobSummary,
  JobDetail,
  GetJobDetailOptions
>({
  resource: 'Job',
  getListClient: getBatchV1Api,
  listCall: {
    cluster: (client, params) => client.listJobForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedJob({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedJob({ namespace, name }),
  transformSummary: transformJobToSummary,
  transformDetail: transformJobToDetail,
})

/** 拉取 Job 列表并转换为摘要，供可观测性看板呈现批量任务健康度。 */
export async function listJobs({
  namespace,
  params,
}: ListJobsOptions = {}): Promise<ListResponse<JobSummary>> {
  return jobService.list({ namespace, params })
}

/** 获取 Job 详情，为看板提供重试策略、条件等信息。 */
export async function getJobDetail(
  namespace: string,
  name: string,
  options: GetJobDetailOptions = {},
): Promise<DetailResponse<JobDetail, V1Job>> {
  return jobService.getDetail(namespace, name, options)
}
