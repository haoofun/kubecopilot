import type { V1Namespace } from '@kubernetes/client-node'

import {
  getAppsV1Api,
  getBatchV1Api,
  getCoreV1Api,
  getNetworkingV1Api,
} from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  NamespaceAggregates,
  transformNamespaceToDetail,
  transformNamespaceToSummary,
} from '../transformers/namespace'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { NamespaceDetail, NamespaceSummary } from '../types/namespace'

const isFulfilled = <T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> => result.status === 'fulfilled'

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

export interface ListNamespacesOptions {
  params?: QueryParams
}

export async function listNamespaces({
  params,
}: ListNamespacesOptions = {}): Promise<ListResponse<NamespaceSummary>> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = await coreV1Api.listNamespace({
    ...requestBase,
  })

  const items = response.items?.map(transformNamespaceToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

export interface GetNamespaceDetailOptions {
  aggregates?: NamespaceAggregates
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getNamespaceDetail(
  name: string,
  {
    aggregates,
    includeRaw = false,
    includeYaml = false,
  }: GetNamespaceDetailOptions = {},
): Promise<DetailResponse<NamespaceDetail, V1Namespace>> {
  const coreV1Api = await getCoreV1Api()

  const namespace: V1Namespace = await coreV1Api.readNamespace({
    name,
  })

  const resolvedAggregates =
    aggregates ?? (await collectNamespaceAggregates(name))

  const detail = transformNamespaceToDetail(namespace, resolvedAggregates)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(namespace) : undefined,
    raw: includeRaw ? toSerializable(namespace) : undefined,
  }
}
