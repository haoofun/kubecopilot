import type { AppsV1Api, V1Deployment } from '@kubernetes/client-node'

import { getAppsV1Api, getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformDeploymentToDetail,
  transformDeploymentToSummary,
} from '../transformers/deployment'
import { transformPodToSummary } from '../transformers/pod'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { DeploymentDetail, DeploymentSummary } from '../types/deployment'
import type { PodSummary } from '../types/pod'

/** Builds a Kubernetes label selector string so the observability board can fetch pods matching a Deployment's template. */
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

/**
 * 控制 Deployment 列表请求的选项；字段映射 K8s list API 以便看板按租户或过滤条件展示工作负载。
 */
export interface ListDeploymentsOptions {
  /** namespace 允许在命名空间级别过滤，映射 `listNamespacedDeployment` 的路径参数。 */
  namespace?: string
  /** params 传递 QueryParams，以便看板透传 label/field selector、分页和 watch 选项。 */
  params?: QueryParams
}

/**
 * Deployment 详情请求的附加选项，允许看板按需附带 Pods、YAML 或原始对象。
 */
export interface GetDeploymentDetailOptions {
  /** includePods 决定是否回传当前 Deployment 下的 PodSummary，方便在详情页直接展开。 */
  includePods?: boolean
  /** includeRaw 会返回完整的 V1Deployment，便于调试时查看所有 K8s 字段。 */
  includeRaw?: boolean
  /** includeYaml 让调用方向用户呈现格式化后的 YAML manifest。 */
  includeYaml?: boolean
}

const deploymentService = createResourceService<
  AppsV1Api,
  V1Deployment,
  DeploymentSummary,
  DeploymentDetail,
  GetDeploymentDetailOptions
>({
  resource: 'Deployment',
  getListClient: getAppsV1Api,
  listCall: {
    cluster: (client, params) => client.listDeploymentForAllNamespaces(params),
    namespaced: (client, namespace, params) =>
      client.listNamespacedDeployment({ namespace, ...params }),
  },
  read: (client, namespace, name) =>
    client.readNamespacedDeployment({ namespace, name }),
  transformSummary: transformDeploymentToSummary,
  transformDetail: transformDeploymentToDetail,
  extendDetail: async ({ resource, detail, options }) => {
    if (!options.includePods) {
      return
    }
    const labelSelector = buildMatchLabelSelector(
      resource.spec?.selector?.matchLabels ?? null,
    )
    if (!labelSelector || !resource.metadata?.namespace) {
      return
    }
    const coreV1Api = await getCoreV1Api()
    const podsList = await coreV1Api.listNamespacedPod({
      namespace: resource.metadata.namespace,
      labelSelector,
    })
    const pods: PodSummary[] = podsList.items?.map(transformPodToSummary) ?? []
    detail.pods = pods
  },
  defaultDetailOptions: {
    includePods: false,
  },
})

/**
 * 获取 Deployment 列表，并转换为看板使用的 DeploymentSummary 集合。
 */
export async function listDeployments({
  namespace,
  params,
}: ListDeploymentsOptions = {}): Promise<ListResponse<DeploymentSummary>> {
  return deploymentService.list({ namespace, params })
}

/**
 * 获取 Deployment 详情并根据选项附带 Pods、YAML 和原始对象，支撑看板的滚动详情体验。
 */
export async function getDeploymentDetail(
  namespace: string,
  name: string,
  options: GetDeploymentDetailOptions = {},
): Promise<DetailResponse<DeploymentDetail, V1Deployment>> {
  return deploymentService.getDetail(namespace, name, options)
}
