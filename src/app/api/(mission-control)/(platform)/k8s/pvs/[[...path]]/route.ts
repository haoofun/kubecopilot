import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import { getPVDetail, listPVs } from '@domain-k8s/services/pv.service'

const pvsApi = createApiRouteHandlers({
  resourceBase: 'pvs',
  kind: 'PersistentVolume',
  telemetry: { route: 'api/k8s/pvs', category: 'K8S' },
  service: {
    namespaced: false as const,
    list: listPVs,
    getDetail: getPVDetail,
  },
})

export const GET = pvsApi.GET
