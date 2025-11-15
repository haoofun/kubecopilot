import { NextRequest } from 'next/server'

import { createDataResponse, createErrorResponse } from '@infra-http/response'
import { ValidationError } from '@infra-http/error'
import { searchK8sResources } from '@domain-k8s/services/search.service'
import type { GlobalSearchResponse } from '@domain-k8s/types/search'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'

/**
 * GET /api/k8s/search fans out to multiple Kubernetes resource types via the domain search service, giving the
 * observability board a single endpoint for fuzzy namespace/pod/workload lookup with optional limits.
 */
const handleSearchGet = async (request: NextRequest): Promise<Response> => {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') ?? ''
  try {
    const totalLimitParam = searchParams.get('limit')
    const perResourceParam = searchParams.get('perResource')

    const totalLimit =
      totalLimitParam !== null
        ? Number.parseInt(totalLimitParam, 10)
        : undefined
    const perResourceLimit =
      perResourceParam !== null
        ? Number.parseInt(perResourceParam, 10)
        : undefined

    if (
      totalLimit !== undefined &&
      (!Number.isFinite(totalLimit) || totalLimit <= 0)
    ) {
      throw new ValidationError('Invalid limit parameter', {
        limit: 'Provide a positive integer',
      })
    }

    if (
      perResourceLimit !== undefined &&
      (!Number.isFinite(perResourceLimit) || perResourceLimit <= 0)
    ) {
      throw new ValidationError('Invalid perResource parameter', {
        perResource: 'Provide a positive integer',
      })
    }

    const items = await searchK8sResources(query, {
      totalLimit,
      limitPerResource: perResourceLimit,
    })

    const payload: GlobalSearchResponse = {
      query,
      items,
    }

    return createDataResponse(payload)
  } catch (error) {
    return createErrorResponse(error, 'global-search')
  }
}

export const GET = withApiTelemetry(
  { route: 'api/k8s/search', category: 'K8S' },
  handleSearchGet,
)
