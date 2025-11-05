import type { NextRequest } from 'next/server'

import { ValidationError } from '@/lib/api/error'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { establishKubernetesSession } from '@/lib/k8s/connection'

type ConnectPayload = {
  kubeconfig?: unknown
}

export async function POST(request: NextRequest) {
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
