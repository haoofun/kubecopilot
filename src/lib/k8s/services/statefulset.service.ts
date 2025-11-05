import type { V1StatefulSet } from '@kubernetes/client-node'

import { getAppsV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformStatefulSetToDetail,
  transformStatefulSetToSummary,
} from '../transformers/statefulset'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type {
  StatefulSetDetail,
  StatefulSetSummary,
} from '../types/statefulset'

export interface ListStatefulSetsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listStatefulSets({
  namespace,
  params,
}: ListStatefulSetsOptions = {}): Promise<ListResponse<StatefulSetSummary>> {
  const appsV1Api = await getAppsV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await appsV1Api.listNamespacedStatefulSet({
        namespace,
        ...requestBase,
      })
    : await appsV1Api.listStatefulSetForAllNamespaces({
        ...requestBase,
      })

  const items = response.items?.map(transformStatefulSetToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

export interface GetStatefulSetDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getStatefulSetDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetStatefulSetDetailOptions = {},
): Promise<DetailResponse<StatefulSetDetail, V1StatefulSet>> {
  const appsV1Api = await getAppsV1Api()
  const statefulSet = await appsV1Api.readNamespacedStatefulSet({
    namespace,
    name,
  })

  const detail = transformStatefulSetToDetail(statefulSet)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(statefulSet) : undefined,
    raw: includeRaw ? toSerializable(statefulSet) : undefined,
  }
}
