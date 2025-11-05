import type { V1ConfigMap } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformConfigMapToDetail,
  transformConfigMapToSummary,
} from '../transformers/configmap'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { ConfigMapDetail, ConfigMapSummary } from '../types/configmap'

interface ListConfigMapsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listConfigMaps({
  namespace,
  params,
}: ListConfigMapsOptions = {}): Promise<ListResponse<ConfigMapSummary>> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await coreV1Api.listNamespacedConfigMap({ namespace, ...requestBase })
    : await coreV1Api.listConfigMapForAllNamespaces({ ...requestBase })

  const items = response.items?.map(transformConfigMapToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetConfigMapDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getConfigMapDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetConfigMapDetailOptions = {},
): Promise<DetailResponse<ConfigMapDetail, V1ConfigMap>> {
  const coreV1Api = await getCoreV1Api()
  const configMap = await coreV1Api.readNamespacedConfigMap({ namespace, name })

  const detail = transformConfigMapToDetail(configMap)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(configMap) : undefined,
    raw: includeRaw ? toSerializable(configMap) : undefined,
  }
}
