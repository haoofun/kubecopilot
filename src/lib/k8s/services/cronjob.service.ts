import type { V1CronJob } from '@kubernetes/client-node'

import { getBatchV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformCronJobToSummary,
  transformCronJobToDetail,
} from '../transformers/cronjob'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { CronJobDetail, CronJobSummary } from '../types/cronjob'

interface ListCronJobsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listCronJobs({
  namespace,
  params,
}: ListCronJobsOptions = {}): Promise<ListResponse<CronJobSummary>> {
  const batchV1Api = await getBatchV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await batchV1Api.listNamespacedCronJob({ namespace, ...requestBase })
    : await batchV1Api.listCronJobForAllNamespaces({ ...requestBase })

  const items = response.items?.map(transformCronJobToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetCronJobDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getCronJobDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetCronJobDetailOptions = {},
): Promise<DetailResponse<CronJobDetail, V1CronJob>> {
  const batchV1Api = await getBatchV1Api()
  const cronJob = await batchV1Api.readNamespacedCronJob({ namespace, name })

  const detail = transformCronJobToDetail(cronJob)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(cronJob) : undefined,
    raw: includeRaw ? toSerializable(cronJob) : undefined,
  }
}
