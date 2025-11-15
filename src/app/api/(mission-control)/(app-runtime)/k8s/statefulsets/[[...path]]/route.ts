import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getStatefulSetDetail,
  listStatefulSets,
} from '@domain-k8s/services/statefulset.service'

const statefulSetsApi = createApiRouteHandlers({
  resourceBase: 'statefulsets',
  kind: 'StatefulSet',
  telemetry: { route: 'api/k8s/statefulsets', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listStatefulSets,
    getDetail: getStatefulSetDetail,
  },
})

export const GET = statefulSetsApi.GET
