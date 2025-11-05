import type { V1PersistentVolumeClaim } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformPVCToDetail,
  transformPVCToSummary,
} from '../transformers/pvc'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { PVCDetail, PVCSummary } from '../types/pvc'

interface ListPVCsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listPVCs({
  namespace,
  params,
}: ListPVCsOptions = {}): Promise<ListResponse<PVCSummary>> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await coreV1Api.listNamespacedPersistentVolumeClaim({
        namespace,
        ...requestBase,
      })
    : await coreV1Api.listPersistentVolumeClaimForAllNamespaces({
        ...requestBase,
      })

  const items = response.items?.map(transformPVCToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetPVCDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getPVCDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetPVCDetailOptions = {},
): Promise<DetailResponse<PVCDetail, V1PersistentVolumeClaim>> {
  const coreV1Api = await getCoreV1Api()
  const pvc = await coreV1Api.readNamespacedPersistentVolumeClaim({
    namespace,
    name,
  })

  const detail = transformPVCToDetail(pvc)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(pvc) : undefined,
    raw: includeRaw ? toSerializable(pvc) : undefined,
  }
}
