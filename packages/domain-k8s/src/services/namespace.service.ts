import type { V1Namespace } from '@kubernetes/client-node'

import {
  getAppsV1Api,
  getBatchV1Api,
  getCoreV1Api,
  getNetworkingV1Api,
} from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  NamespaceAggregates,
  transformNamespaceToDetail,
  transformNamespaceToSummary,
} from '../transformers/namespace'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { NamespaceDetail, NamespaceSummary } from '../types/namespace'

/** Type guard for Promise results so aggregate collectors can safely unwrap fulfilled Kubernetes calls. */
const isFulfilled = <T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> => result.status === 'fulfilled'

/**
 * Collects per-namespace aggregates (workloads, networking, config, quotas) so the observability board can present a single dashboard card.
 */
async function collectNamespaceAggregates(
  namespace: string,
): Promise<NamespaceAggregates> {
  try {
    const [appsApi, coreApi, batchApi, networkingApi] = await Promise.all([
      getAppsV1Api(),
      getCoreV1Api(),
      getBatchV1Api(),
      getNetworkingV1Api(),
    ])

    const results = await Promise.allSettled([
      appsApi.listNamespacedDeployment({ namespace }),
      appsApi.listNamespacedStatefulSet({ namespace }),
      appsApi.listNamespacedDaemonSet({ namespace }),
      coreApi.listNamespacedPod({ namespace }),
      batchApi.listNamespacedJob({ namespace }),
      batchApi.listNamespacedCronJob({ namespace }),
      coreApi.listNamespacedService({ namespace }),
      networkingApi.listNamespacedIngress({ namespace }),
      coreApi.listNamespacedConfigMap({ namespace }),
      coreApi.listNamespacedSecret({ namespace }),
      coreApi.listNamespacedPersistentVolumeClaim({ namespace }),
      coreApi.listNamespacedResourceQuota({ namespace }),
    ])

    const [
      deploymentsResult,
      statefulSetsResult,
      daemonSetsResult,
      podsResult,
      jobsResult,
      cronJobsResult,
      servicesResult,
      ingressesResult,
      configMapsResult,
      secretsResult,
      pvcsResult,
      quotasResult,
    ] = results

    const deployments = isFulfilled(deploymentsResult)
      ? (deploymentsResult.value.items ?? [])
      : []
    const statefulSets = isFulfilled(statefulSetsResult)
      ? (statefulSetsResult.value.items ?? [])
      : []
    const daemonSets = isFulfilled(daemonSetsResult)
      ? (daemonSetsResult.value.items ?? [])
      : []
    const pods = isFulfilled(podsResult) ? (podsResult.value.items ?? []) : []
    const jobs = isFulfilled(jobsResult) ? (jobsResult.value.items ?? []) : []
    const cronJobs = isFulfilled(cronJobsResult)
      ? (cronJobsResult.value.items ?? [])
      : []
    const services = isFulfilled(servicesResult)
      ? (servicesResult.value.items ?? [])
      : []
    const ingresses = isFulfilled(ingressesResult)
      ? (ingressesResult.value.items ?? [])
      : []
    const configMaps = isFulfilled(configMapsResult)
      ? (configMapsResult.value.items ?? [])
      : []
    const secrets = isFulfilled(secretsResult)
      ? (secretsResult.value.items ?? [])
      : []
    const persistentVolumeClaims = isFulfilled(pvcsResult)
      ? (pvcsResult.value.items ?? [])
      : []
    const resourceQuotas = isFulfilled(quotasResult)
      ? (quotasResult.value.items ?? [])
      : []

    const workloads: NamespaceAggregates['workloads'] = {
      deployments: {
        count: deployments.length,
        ready: deployments.filter((deployment) => {
          const desired = deployment.spec?.replicas ?? 1
          const ready = deployment.status?.readyReplicas ?? 0
          return desired === 0 ? true : ready >= desired
        }).length,
      },
      statefulSets: {
        count: statefulSets.length,
        ready: statefulSets.filter((set) => {
          const desired = set.spec?.replicas ?? 1
          const ready = set.status?.readyReplicas ?? 0
          return desired === 0 ? true : ready >= desired
        }).length,
      },
      daemonSets: {
        count: daemonSets.length,
        ready: daemonSets.filter((ds) => {
          const desired = ds.status?.desiredNumberScheduled ?? 0
          const ready = ds.status?.numberReady ?? 0
          return desired === 0 ? true : ready >= desired
        }).length,
      },
      pods: {
        count: pods.length,
        running: pods.filter((pod) => pod.status?.phase === 'Running').length,
        succeeded: pods.filter((pod) => pod.status?.phase === 'Succeeded')
          .length,
        failed: pods.filter((pod) => pod.status?.phase === 'Failed').length,
      },
      jobs: {
        count: jobs.length,
        succeeded: jobs.filter((job) => (job.status?.succeeded ?? 0) > 0)
          .length,
        failed: jobs.filter((job) => (job.status?.failed ?? 0) > 0).length,
      },
      cronJobs: {
        count: cronJobs.length,
        active: cronJobs.reduce(
          (acc, job) => acc + (job.status?.active?.length ?? 0),
          0,
        ),
      },
    }

    const networking: NamespaceAggregates['networking'] = {
      services: { count: services.length },
      ingresses: { count: ingresses.length },
    }

    const config: NamespaceAggregates['config'] = {
      configMaps: { count: configMaps.length },
      secrets: { count: secrets.length },
      persistentVolumeClaims: { count: persistentVolumeClaims.length },
    }

    const resourceUsage = extractResourceUsage(resourceQuotas)

    return {
      workloads,
      networking,
      config,
      resourceUsage,
    }
  } catch (error) {
    console.error(
      `[namespace.service] Failed to collect aggregates for namespace "${namespace}":`,
      error,
    )
    return {}
  }
}

/** Extracts CPU/memory quota and usage values from ResourceQuota objects for the namespace capacity widget. */
function extractResourceUsage(
  quotas: Array<{
    status?: { hard?: Record<string, string>; used?: Record<string, string> }
  }>,
): NamespaceAggregates['resourceUsage'] {
  if (!quotas || quotas.length === 0) {
    return null
  }

  const quota = quotas.find((item) => item.status?.hard) ?? quotas[0]
  const hard = quota.status?.hard ?? {}
  const used = quota.status?.used ?? {}

  const getValue = (collection: Record<string, string>, key: string) =>
    collection[key] ?? '—'

  const limitsCpu = getValue(hard, 'limits.cpu')
  const limitsMemory = getValue(hard, 'limits.memory')
  const requestsCpu = getValue(hard, 'requests.cpu')
  const requestsMemory = getValue(hard, 'requests.memory')

  const usageCpu = used['requests.cpu']
  const usageMemory = used['requests.memory']

  return {
    limits: { cpu: limitsCpu, memory: limitsMemory },
    requests: { cpu: requestsCpu, memory: requestsMemory },
    usage:
      usageCpu || usageMemory
        ? { cpu: usageCpu ?? '—', memory: usageMemory ?? '—' }
        : undefined,
  }
}

/**
 * 命名空间列表允许传入 Kubernetes QueryParams，帮助可观测性看板按 label/field 过滤租户。
 */
export interface ListNamespacesOptions {
  /** params 直接对应 Kubernetes listNamespace 的查询字符串，为看板的搜索栏提供支撑。 */
  params?: QueryParams
}

/**
 * 获取 Namespace 列表并转为 NamespaceSummary，支撑看板的多租户概览。
 */
export async function listNamespaces({
  params,
}: ListNamespacesOptions = {}): Promise<ListResponse<NamespaceSummary>> {
  return namespaceService.list({ params })
}

/**
 * Namespace 详情选项，允许提前注入聚合数据或请求 YAML、原始对象。
 */
export interface GetNamespaceDetailOptions {
  /** aggregates 让调用方复用预先计算的统计数据，避免看板重复拉取 Kubernetes。 */
  aggregates?: NamespaceAggregates
  /** includeRaw 返回完整的 V1Namespace，供调试或导出使用。 */
  includeRaw?: boolean
  /** includeYaml 生成 YAML 字符串，用于 UI 呈现。 */
  includeYaml?: boolean
}

const namespaceService = createResourceService<
  Awaited<ReturnType<typeof getCoreV1Api>>,
  V1Namespace,
  NamespaceSummary,
  NamespaceDetail,
  GetNamespaceDetailOptions
>({
  resource: 'Namespace',
  namespaced: false,
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) => client.listNamespace(params),
  },
  read: (client, name) => client.readNamespace({ name }),
  transformSummary: transformNamespaceToSummary,
  transformDetail: (namespace) => transformNamespaceToDetail(namespace),
  extendDetail: async ({ resource, detail, options }) => {
    const namespaceName = resource.metadata?.name
    if (!namespaceName) {
      return
    }
    const aggregates =
      options.aggregates ?? (await collectNamespaceAggregates(namespaceName))
    const enriched = transformNamespaceToDetail(resource, aggregates)
    detail.workloads = enriched.workloads
    detail.networking = enriched.networking
    detail.config = enriched.config
    detail.resourceUsage = enriched.resourceUsage
  },
})

/**
 * 获取指定命名空间的详情及聚合资源概况，为观察面板提供单页洞察。
 */
export async function getNamespaceDetail(
  name: string,
  {
    aggregates,
    includeRaw = false,
    includeYaml = false,
  }: GetNamespaceDetailOptions = {},
): Promise<DetailResponse<NamespaceDetail, V1Namespace>> {
  return namespaceService.getDetail(name, {
    aggregates,
    includeRaw,
    includeYaml,
  })
}
