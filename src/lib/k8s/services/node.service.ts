import type { V1Node } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { toCleanYAML } from '../transformers/common'
import { toSerializable } from '../utils/serialization'
import {
  transformNodeToDetail,
  transformNodeToSummary,
} from '../transformers/node'
import { buildListCallParams } from '../utils/params'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { NodeDetail, NodeSummary } from '../types/node'

interface ListNodesOptions {
  params?: QueryParams
}

export async function listNodes({ params }: ListNodesOptions = {}): Promise<
  ListResponse<NodeSummary>
> {
  const coreV1Api = await getCoreV1Api()
  const requestBase = buildListCallParams(params)

  const response = await coreV1Api.listNode({
    ...requestBase,
  })

  const items = response.items?.map(transformNodeToSummary) ?? []

  return {
    items,
    metadata: {
      continueToken: response.metadata?._continue ?? undefined,
      resourceVersion: response.metadata?.resourceVersion ?? undefined,
    },
  }
}

interface GetNodeDetailOptions {
  includeRaw?: boolean
  includeYaml?: boolean
}

export async function getNodeDetail(
  name: string,
  { includeRaw = false, includeYaml = false }: GetNodeDetailOptions = {},
): Promise<DetailResponse<NodeDetail, V1Node>> {
  const coreV1Api = await getCoreV1Api()
  const node = await coreV1Api.readNode({ name })

  const detail = transformNodeToDetail(node)

  return {
    summary: detail,
    yaml: includeYaml ? toCleanYAML(node) : undefined,
    raw: includeRaw ? toSerializable(node) : undefined,
  }
}
