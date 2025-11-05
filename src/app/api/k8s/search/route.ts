import { NextRequest } from 'next/server'

import { createDataResponse, createErrorResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/error'
import { searchK8sResources } from '@/lib/k8s/services/search.service'
import type { GlobalSearchResponse } from '@/lib/k8s/types/search'

export async function GET(request: NextRequest) {
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
