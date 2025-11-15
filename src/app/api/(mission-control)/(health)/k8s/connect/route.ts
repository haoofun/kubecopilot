import type { NextRequest } from 'next/server'

import { ValidationError } from '@infra-http/error'
import {
  createErrorResponse,
  createSuccessResponse,
} from '@infra-http/response'
import { establishKubernetesSession } from '@domain-k8s/connection'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'

type ConnectPayload = {
  kubeconfig?: unknown
}

/**
 * POST /api/k8s/connect stores a kubeconfig in the user's session after validation so the observability board can
 * issue server-side Kubernetes API calls without embedding credentials in the client.
 */
const handleConnectPost = async (request: NextRequest) => {
  try {
    const body: ConnectPayload = await request.json()
    const kubeconfig = body.kubeconfig

    if (typeof kubeconfig !== 'string' || kubeconfig.trim().length === 0) {
      throw new ValidationError('Kubeconfig is required.', {
        kubeconfig: 'Required',
      })
    }

    await establishKubernetesSession(kubeconfig)

    return createSuccessResponse({
      message: 'Connection successful.',
    })
  } catch (error) {
    return createErrorResponse(error, 'connect')
  }
}

export const POST = withApiTelemetry(
  { route: 'api/k8s/connect', category: 'K8S' },
  handleConnectPost,
)
