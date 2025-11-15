import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getIngressDetail,
  listIngresses,
} from '@domain-k8s/services/ingress.service'

const ingressesApi = createApiRouteHandlers({
  resourceBase: 'ingresses',
  kind: 'Ingress',
  telemetry: { route: 'api/k8s/ingresses', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listIngresses,
    getDetail: getIngressDetail,
  },
})

export const GET = ingressesApi.GET
