import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getServiceDetail,
  listServices,
} from '@domain-k8s/services/service.service'
import { parseOptionalBoolean } from '@domain-k8s/utils/params'

const servicesApi = createApiRouteHandlers({
  resourceBase: 'services',
  kind: 'Service',
  telemetry: { route: 'api/k8s/services', category: 'K8S' },
  detailQueryKeys: ['includeEndpoints'],
  parseDetailOptions: (searchParams) => ({
    includeRaw: parseOptionalBoolean(
      searchParams.get('includeRaw') ?? searchParams.get('raw'),
    ),
    includeYaml: parseOptionalBoolean(searchParams.get('includeYaml')),
    includeEndpoints:
      parseOptionalBoolean(searchParams.get('includeEndpoints')) ?? true,
  }),
  service: {
    namespaced: true as const,
    list: listServices,
    getDetail: getServiceDetail,
  },
})

export const GET = servicesApi.GET
