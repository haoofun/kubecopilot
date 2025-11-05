import type { V1Endpoints, V1Service } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformServiceToDetail,
  transformServiceToSummary,
} from '../transformers/service'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { ServiceDetail, ServiceSummary } from '../types/service'

export interface ListServicesOptions {
  namespace?: string
  params?: QueryParams
}

export async function listServices({
  namespace,
  params,
}: ListServicesOptions = {}): Promise<ListResponse<ServiceSummary>> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await coreV1Api.listNamespacedService({
        namespace,
        ...requestBase,
      })
    : await coreV1Api.listServiceForAllNamespaces({
        ...requestBase,
      })

  const items = response.items?.map(transformServiceToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

export interface GetServiceDetailOptions {
  includeEndpoints?: boolean
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getServiceDetail(
  namespace: string,
  name: string,
  {
    includeEndpoints = true,
    includeRaw = false,
    includeYaml = false,
  }: GetServiceDetailOptions = {},
): Promise<DetailResponse<ServiceDetail, V1Service>> {
  const coreV1Api = await getCoreV1Api()

  const service: V1Service = await coreV1Api.readNamespacedService({
    namespace,
    name,
  })

  let endpoints: V1Endpoints | null = null
  if (includeEndpoints) {
    try {
      endpoints = await coreV1Api.readNamespacedEndpoints({
        namespace,
        name,
      })
    } catch {
      endpoints = null
    }
  }

  const detail = transformServiceToDetail(service, endpoints)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(service) : undefined,
    raw: includeRaw ? toSerializable(service) : undefined,
  }
}
