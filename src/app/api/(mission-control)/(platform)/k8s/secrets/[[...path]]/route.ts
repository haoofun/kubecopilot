import { createApiRouteHandlers } from '@/lib/k8s/createApiRouteHandlers'
import {
  getSecretDetail,
  listSecrets,
} from '@domain-k8s/services/secret.service'

const secretsApi = createApiRouteHandlers({
  resourceBase: 'secrets',
  kind: 'Secret',
  telemetry: { route: 'api/k8s/secrets', category: 'K8S' },
  service: {
    namespaced: true as const,
    list: listSecrets,
    getDetail: getSecretDetail,
  },
})

export const GET = secretsApi.GET
