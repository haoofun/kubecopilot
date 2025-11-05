import { NextRequest } from 'next/server'

import { createDataResponse, createErrorResponse } from '@/lib/api/response'
import { listClusterEvents, listEvents } from '@/lib/k8s/services/event.service'
import { extractQueryParams } from '@/lib/k8s/utils/params'

export async function GET(request: NextRequest) {
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
