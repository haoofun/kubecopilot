import type { CoreV1Api, V1Node } from '@kubernetes/client-node'

import { getCoreV1Api } from '../client'
import { createResourceService } from '../factories/resource-service'
import {
  transformNodeToDetail,
  transformNodeToSummary,
} from '../transformers/node'
import type { DetailResponse, ListResponse, QueryParams } from '../types/common'
import type { NodeDetail, NodeSummary } from '../types/node'

/** Node 列表请求选项，允许可观测性看板把 QueryParams 传递至 Kubernetes listNode。 */
interface ListNodesOptions {
  /** params 对应 Kubernetes listNode 的查询参数，支撑 watch、分页等需求。 */
  params?: QueryParams
}

/** Node 详情响应附加开关。 */
interface GetNodeDetailOptions {
  /** includeRaw 返回完整 V1Node，方便看板调试。 */
  includeRaw?: boolean
  /** includeYaml 控制是否将节点 manifest 以 YAML 形式返回。 */
  includeYaml?: boolean
}

const nodeService = createResourceService<
  CoreV1Api,
  V1Node,
  NodeSummary,
  NodeDetail,
  GetNodeDetailOptions
>({
  resource: 'Node',
  namespaced: false,
  getListClient: getCoreV1Api,
  listCall: {
    cluster: (client, params) => client.listNode(params),
  },
  read: (client, name) => client.readNode({ name }),
  transformSummary: transformNodeToSummary,
  transformDetail: transformNodeToDetail,
})

/** 获取 Node 列表并生成摘要，供看板构建设备拓扑。 */
export async function listNodes({ params }: ListNodesOptions = {}): Promise<
  ListResponse<NodeSummary>
> {
  return nodeService.list({ params })
}

/** 获取节点详情，支撑拓扑面板显示容量和条件等信息。 */
export async function getNodeDetail(
  name: string,
  options: GetNodeDetailOptions = {},
): Promise<DetailResponse<NodeDetail, V1Node>> {
  return nodeService.getDetail(name, options)
}
