import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import { getPodDetail, listPods } from '@domain-k8s/services/pod.service'

const podsApi = createApiRouteHandlers({
  resourceBase: 'pods',
  kind: 'Pod',
  telemetry: { route: 'api/k8s/pods', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listPods,
    getDetail: getPodDetail,
  },
})

export const GET = podsApi.GET
