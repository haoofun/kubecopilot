import type { V1Secret } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformSecretToDetail,
  transformSecretToSummary,
} from '../transformers/secret'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { SecretDetail, SecretSummary } from '../types/secret'

interface ListSecretsOptions {
  namespace?: string
  params?: QueryParams
}

export async function listSecrets({
  namespace,
  params,
}: ListSecretsOptions = {}): Promise<ListResponse<SecretSummary>> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = namespace
    ? await coreV1Api.listNamespacedSecret({ namespace, ...requestBase })
    : await coreV1Api.listSecretForAllNamespaces({ ...requestBase })

  const items = response.items?.map(transformSecretToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetSecretDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getSecretDetail(
  namespace: string,
  name: string,
  { includeRaw = false, includeYaml = false }: GetSecretDetailOptions = {},
): Promise<DetailResponse<SecretDetail, V1Secret>> {
  const coreV1Api = await getCoreV1Api()
  const secret = await coreV1Api.readNamespacedSecret({ namespace, name })

  const detail = transformSecretToDetail(secret)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(secret) : undefined,
    raw: includeRaw ? toSerializable(secret) : undefined,
  }
}
