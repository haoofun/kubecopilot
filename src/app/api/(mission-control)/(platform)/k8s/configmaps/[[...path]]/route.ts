import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getConfigMapDetail,
  listConfigMaps,
} from '@domain-k8s/services/configmap.service'

const configMapsApi = createApiRouteHandlers({
  resourceBase: 'configmaps',
  kind: 'ConfigMap',
  telemetry: { route: 'api/k8s/configmaps', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listConfigMaps,
    getDetail: getConfigMapDetail,
  },
})

export const GET = configMapsApi.GET
