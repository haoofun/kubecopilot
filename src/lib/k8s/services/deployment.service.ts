import type { V1Deployment } from '@kubernetes/client-node'

import { getAppsV1Api, getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import {
  transformDeploymentToDetail,
  transformDeploymentToSummary,
} from '../transformers/deployment'
import { transformPodToSummary } from '../transformers/pod'
import { buildListCallParams } from '../utils/params'
import { toSerializable } from '../utils/serialization'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { DeploymentDetail, DeploymentSummary } from '../types/deployment'
import type { PodSummary } from '../types/pod'

const buildMatchLabelSelector = (
  matchLabels: Record<string, string> | undefined | null,
): string | undefined => {
  if (!matchLabels) {
    return undefined
  }

  const entries = Object.entries(matchLabels)
  if (entries.length === 0) {
    return undefined
  }

  return entries.map(([key, value]) => `${key}=${value}`).join(',')
}

export interface ListDeploymentsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listDeployments({
  namespace,
  params,
}: ListDeploymentsOptions = {}): Promise<ListResponse<DeploymentSummary>> {
  const appsV1Api = await getAppsV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await appsV1Api.listNamespacedDeployment({
        namespace,
        ...requestBase,
      })
    : await appsV1Api.listDeploymentForAllNamespaces({
        ...requestBase,
      })

  const items = response.items?.map(transformDeploymentToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

export interface GetDeploymentDetailOptions {
  includePods?: boolean
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getDeploymentDetail(
  namespace: string,
  name: string,
  {
    includePods = false,
    includeRaw = false,
    includeYaml = false,
  }: GetDeploymentDetailOptions = {},
): Promise<DetailResponse<DeploymentDetail, V1Deployment>> {
  const appsV1Api = await getAppsV1Api()

  const deployment: V1Deployment = await appsV1Api.readNamespacedDeployment({
    namespace,
    name,
  })

  const detail = transformDeploymentToDetail(deployment)

  if (includePods) {
    const labelSelector = buildMatchLabelSelector(
      deployment.spec?.selector?.matchLabels ?? null,
    )

    if (labelSelector) {
      const coreV1Api = await getCoreV1Api()
      const podsList = await coreV1Api.listNamespacedPod({
        namespace,
        labelSelector,
      })
      const pods: PodSummary[] =
        podsList.items?.map(transformPodToSummary) ?? []

      detail.pods = pods
    }
  }

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(deployment) : undefined,
    raw: includeRaw ? toSerializable(deployment) : undefined,
  }
}
