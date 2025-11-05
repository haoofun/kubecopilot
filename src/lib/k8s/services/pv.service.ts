import type { V1PersistentVolume } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import { transformPVToDetail, transformPVToSummary } from '../transformers/pv'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { PVDetail, PVSummary } from '../types/pv'

interface ListPVsOptions {
  params?: QueryParams
}

export async function listPVs({ params }: ListPVsOptions = {}): Promise<
  ListResponse<PVSummary>
> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = await coreV1Api.listPersistentVolume({
    ...requestBase,
  })

  const items = response.items?.map(transformPVToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetPVDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getPVDetail(
  name: string,
  { includeRaw = false, includeYaml = false }: GetPVDetailOptions = {},
): Promise<DetailResponse<PVDetail, V1PersistentVolume>> {
  const coreV1Api = await getCoreV1Api()
  const pv = await coreV1Api.readPersistentVolume({ name })

  const detail = transformPVToDetail(pv)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(pv) : undefined,
    raw: includeRaw ? toSerializable(pv) : undefined,
  }
}
