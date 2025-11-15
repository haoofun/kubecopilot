import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getDaemonSetDetail,
  listDaemonSets,
} from '@domain-k8s/services/daemonset.service'

const daemonSetsApi = createApiRouteHandlers({
  resourceBase: 'daemonsets',
  kind: 'DaemonSet',
  telemetry: { route: 'api/k8s/daemonsets', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listDaemonSets,
    getDetail: getDaemonSetDetail,
  },
})

export const GET = daemonSetsApi.GET
