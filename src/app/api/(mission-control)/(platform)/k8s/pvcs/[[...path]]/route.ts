import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import { getPVCDetail, listPVCs } from '@domain-k8s/services/pvc.service'

const pvcsApi = createApiRouteHandlers({
  resourceBase: 'pvcs',
  kind: 'PersistentVolumeClaim',
  telemetry: { route: 'api/k8s/pvcs', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listPVCs,
    getDetail: getPVCDetail,
  },
})

export const GET = pvcsApi.GET
