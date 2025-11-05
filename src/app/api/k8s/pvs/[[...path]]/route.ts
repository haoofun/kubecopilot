import { NextRequest } from 'next/server'

import { createDataResponse, createErrorResponse } from '@/lib/api/response'
import { NotFoundError, ValidationError } from '@/lib/api/error'
import { listPVs, getPVDetail } from '@/lib/k8s/services/pv.service'
import { listEventsForResource } from '@/lib/k8s/services/event.service'
import {
  extractQueryParams,
  parseOptionalBoolean,
} from '@/lib/k8s/utils/params'
import type { QueryParams } from '@/lib/k8s/types/common'

type RouteParams = {
  path?: string[]
}

const DETAIL_FLAGS = ['includeRaw', 'includeYaml'] as const

function buildQueryParams(
  searchParams: URLSearchParams,
  exclude: Iterable<string> = [],
): QueryParams | undefined {
  const excludeSet = new Set<string>([...DETAIL_FLAGS, ...Array.from(exclude)])
  const params = extractQueryParams(searchParams, excludeSet)
  return Object.keys(params).length > 0 ? params : undefined
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const { path = [] } = await context.params
  const segments = path ?? []
  const searchParams = request.nextUrl.searchParams

  try {
    if (segments.length === 0) {
      const params = buildQueryParams(searchParams)
      const result = await listPVs({ params })
      return createDataResponse(result)
    }

    if (segments.length === 1) {
      const [name] = segments
      const includeRaw = parseOptionalBoolean(searchParams.get('includeRaw'))
      const includeYaml = parseOptionalBoolean(searchParams.get('includeYaml'))

      const result = await getPVDetail(name, {
        includeRaw,
        includeYaml,
      })
      return createDataResponse(result)
    }

    if (segments.length === 2 && segments[1] === 'events') {
      const [name] = segments
      const uid = searchParams.get('uid') ?? undefined
      const nameParam = searchParams.get('name') ?? name

      if (!uid && !nameParam) {
        throw new ValidationError('Missing PV identifier for event lookup', {
          uid: 'Provide uid',
        })
      }

      const params = buildQueryParams(searchParams, ['uid', 'name'])
      const result = await listEventsForResource({
        uid,
        name: nameParam,
        kind: 'PersistentVolume',
        params,
      })
      return createDataResponse(result)
    }

    throw new NotFoundError('PersistentVolume resource path')
  } catch (error) {
    return createErrorResponse(error, 'pvs')
  }
}
