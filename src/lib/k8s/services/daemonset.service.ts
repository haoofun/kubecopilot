import type { V1DaemonSet } from '@kubernetes/client-node'

import { getAppsV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformDaemonSetToDetail,
  transformDaemonSetToSummary,
} from '../transformers/daemonset'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { DaemonSetDetail, DaemonSetSummary } from '../types/daemonset'

interface ListDaemonSetsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listDaemonSets({
  namespace,
  params,
}: ListDaemonSetsOptions = {}): Promise<ListResponse<DaemonSetSummary>> {
  const appsV1Api = await getAppsV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await appsV1Api.listNamespacedDaemonSet({ namespace, ...requestBase })
    : await appsV1Api.listDaemonSetForAllNamespaces({ ...requestBase })

  const items = response.items?.map(transformDaemonSetToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetDaemonSetDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getDaemonSetDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetDaemonSetDetailOptions = {},
): Promise<DetailResponse<DaemonSetDetail, V1DaemonSet>> {
  const appsV1Api = await getAppsV1Api()
  const daemonSet = await appsV1Api.readNamespacedDaemonSet({ namespace, name })

  const detail = transformDaemonSetToDetail(daemonSet)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(daemonSet) : undefined,
    raw: includeRaw ? toSerializable(daemonSet) : undefined,
  }
}
