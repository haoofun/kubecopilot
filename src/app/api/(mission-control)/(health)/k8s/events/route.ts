import { NextRequest } from 'next/server'

import { createDataResponse, createErrorResponse } from '@infra-http/response'
import {
  listClusterEvents,
  listEvents,
} from '@domain-k8s/services/event.service'
import { extractQueryParams } from '@domain-k8s/utils/params'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'

/**
 * GET /api/k8s/events provides a namespace-scoped or cluster-wide feed of Kubernetes events, applying optional
 * kind/name/uid selectors so the observability board can show targeted timelines.
 */
const handleEventsGet = async (request: NextRequest): Promise<Response> => {
  const searchParams = request.nextUrl.searchParams

  try {
    const namespace = searchParams.get('namespace') ?? undefined
    const kind = searchParams.get('kind') ?? undefined
    const resourceName = searchParams.get('name') ?? undefined
    const uid = searchParams.get('uid') ?? undefined

    const params = extractQueryParams(searchParams, [
      'namespace',
      'kind',
      'name',
      'uid',
    ])
    const fieldSelectors: string[] = []

    if (kind) {
      fieldSelectors.push(`involvedObject.kind=${kind}`)
    }
    if (resourceName) {
      fieldSelectors.push(`involvedObject.name=${resourceName}`)
    }
    if (uid) {
      fieldSelectors.push(`involvedObject.uid=${uid}`)
    }

    if (fieldSelectors.length > 0) {
      params.fieldSelector = fieldSelectors.join(',')
    }

    const result = namespace
      ? await listEvents({ namespace, params })
      : await listClusterEvents({ params })

    return createDataResponse(result)
  } catch (error) {
    return createErrorResponse(error, 'events')
  }
}

export const GET = withApiTelemetry(
  { route: 'api/k8s/events', category: 'K8S' },
  handleEventsGet,
)
