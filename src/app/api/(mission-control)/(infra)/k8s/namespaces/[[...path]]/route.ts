import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getNamespaceDetail,
  listNamespaces,
} from '@domain-k8s/services/namespace.service'

const namespacesApi = createApiRouteHandlers({
  resourceBase: 'namespaces',
  kind: 'Namespace',
  telemetry: { route: 'api/k8s/namespaces', category: 'K8S' },
  service: {
    namespaced: false as const,
    list: listNamespaces,
    getDetail: getNamespaceDetail,
  },
})

export const GET = namespacesApi.GET
