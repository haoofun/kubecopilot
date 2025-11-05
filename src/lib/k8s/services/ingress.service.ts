import type { V1Ingress } from '@kubernetes/client-node'

import { getNetworkingV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformIngressToDetail,
  transformIngressToSummary,
} from '../transformers/ingress'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { IngressDetail, IngressSummary } from '../types/ingress'

interface ListIngressesOptions {
  namespace?: string
  params?: QueryParams
}

export async function listIngresses({
  namespace,
  params,
}: ListIngressesOptions = {}): Promise<ListResponse<IngressSummary>> {
  const networkingApi = await getNetworkingV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await networkingApi.listNamespacedIngress({ namespace, ...requestBase })
    : await networkingApi.listIngressForAllNamespaces({ ...requestBase })

  const items = response.items?.map(transformIngressToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetIngressDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getIngressDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetIngressDetailOptions = {},
): Promise<DetailResponse<IngressDetail, V1Ingress>> {
  const networkingApi = await getNetworkingV1Api()
  const ingress = await networkingApi.readNamespacedIngress({ namespace, name })

  const detail = transformIngressToDetail(ingress)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(ingress) : undefined,
    raw: includeRaw ? toSerializable(ingress) : undefined,
  }
}
