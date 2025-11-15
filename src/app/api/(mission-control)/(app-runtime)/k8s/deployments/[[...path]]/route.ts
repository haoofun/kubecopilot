import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getDeploymentDetail,
  listDeployments,
} from '@domain-k8s/services/deployment.service'
import { parseOptionalBoolean } from '@domain-k8s/utils/params'

const deploymentsApi = createApiRouteHandlers({
  resourceBase: 'deployments',
  kind: 'Deployment',
  telemetry: { route: 'api/k8s/deployments', category: 'K8S' },
  detailQueryKeys: ['includePods'],
  parseDetailOptions: (searchParams) => ({
    includeRaw: parseOptionalBoolean(
      searchParams.get('includeRaw') ?? searchParams.get('raw'),
    ),
    includeYaml: parseOptionalBoolean(searchParams.get('includeYaml')),
    includePods: parseOptionalBoolean(searchParams.get('includePods')) ?? false,
  }),
  service: {
    namespaced: true as const,
    list: listDeployments,
    getDetail: getDeploymentDetail,
  },
})

export const GET = deploymentsApi.GET
