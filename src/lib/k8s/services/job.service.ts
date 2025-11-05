import type { V1Job } from '@kubernetes/client-node'

import { getBatchV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformJobToDetail,
  transformJobToSummary,
} from '../transformers/job'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { JobDetail, JobSummary } from '../types/job'

interface ListJobsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listJobs({
  namespace,
  params,
}: ListJobsOptions = {}): Promise<ListResponse<JobSummary>> {
  const batchV1Api = await getBatchV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await batchV1Api.listNamespacedJob({ namespace, ...requestBase })
    : await batchV1Api.listJobForAllNamespaces({ ...requestBase })

  const items = response.items?.map(transformJobToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetJobDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getJobDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetJobDetailOptions = {},
): Promise<DetailResponse<JobDetail, V1Job>> {
  const batchV1Api = await getBatchV1Api()
  const job = await batchV1Api.readNamespacedJob({ namespace, name })

  const detail = transformJobToDetail(job)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(job) : undefined,
    raw: includeRaw ? toSerializable(job) : undefined,
  }
}
