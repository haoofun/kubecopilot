import type { V1Pod } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import {
  transformPodToDetail,
  transformPodToSummary,
} from '../transformers/pod'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { PodDetail, PodSummary } from '../types/pod'

export interface ListPodsOptions {
  namespace?: string
  params?: QueryParams
}

/**
 * 获取 Pod 列表
 */
export async function listPods({
  namespace,
  params,
}: ListPodsOptions = {}): Promise<ListResponse<PodSummary>> {
  const coreV1Api = await getCoreV1Api()

  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await coreV1Api.listNamespacedPod({
        namespace,
        ...requestBase,
      })
    : await coreV1Api.listPodForAllNamespaces({
        ...requestBase,
      })

  const items = response.items?.map(transformPodToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

export interface GetPodDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

/**
 * 获取单个 Pod 的详情
 */
export async function getPodDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetPodDetailOptions = {},
): Promise<DetailResponse<PodDetail, V1Pod>> {
  const coreV1Api = await getCoreV1Api()

  const pod: V1Pod = await coreV1Api.readNamespacedPod({
    namespace,
    name,
  })

  const summary = transformPodToDetail(pod)

  return {
    summary,
    yaml: includeYaml ? toCleanYAML(pod) : undefined,
    raw: includeRaw ? JSON.parse(JSON.stringify(pod)) : undefined,
  }
}
