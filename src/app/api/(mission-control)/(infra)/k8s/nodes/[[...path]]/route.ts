import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import { getNodeDetail, listNodes } from '@domain-k8s/services/node.service'

const nodesApi = createApiRouteHandlers({
  resourceBase: 'nodes',
  kind: 'Node',
  telemetry: { route: 'api/k8s/nodes', category: 'K8S' },
  service: {
    namespaced: false as const,
    list: listNodes,
    getDetail: getNodeDetail,
  },
})

export const GET = nodesApi.GET
