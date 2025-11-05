import { NextRequest } from 'next/server'

import { createDataResponse, createErrorResponse } from '@/lib/api/response'
import { ValidationError, NotFoundError } from '@/lib/api/error'
import { listPods, getPodDetail } from '@/lib/k8s/services/pod.service'
import { listEventsForResource } from '@/lib/k8s/services/event.service'
import {
  extractQueryParams,
  parseOptionalBoolean,
} from '@/lib/k8s/utils/params'
import type { QueryParams } from '@/lib/k8s/types/common'

type RouteParams = {
  path?: string[]
}

const INCLUDE_FLAGS = ['includeRaw', 'includeYaml'] as const

function buildQueryParams(
  searchParams: URLSearchParams,
  exclude: Iterable<string> = [],
): QueryParams | undefined {
  const excludeSet = new Set<string>([...INCLUDE_FLAGS, ...Array.from(exclude)])
  const queryParams = extractQueryParams(searchParams, excludeSet)
  return Object.keys(queryParams).length > 0 ? queryParams : undefined
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
      const result = await listPods({ params })
      return createDataResponse(result)
    }

    if (segments.length === 1) {
      const [namespace] = segments
      const params = buildQueryParams(searchParams)
      const result = await listPods({ namespace, params })
      return createDataResponse(result)
    }

    if (segments.length === 2) {
      const [namespace, name] = segments
      const includeRaw = parseOptionalBoolean(searchParams.get('includeRaw'))
      const includeYaml = parseOptionalBoolean(searchParams.get('includeYaml'))
      const result = await getPodDetail(namespace, name, {
        includeRaw,
        includeYaml,
      })
      return createDataResponse(result)
    }

    if (segments.length === 3 && segments[2] === 'events') {
      const [namespace] = segments
      const uid = searchParams.get('uid') ?? undefined
      const nameParam = searchParams.get('name') ?? undefined

      if (!uid && !nameParam) {
        throw new ValidationError('Missing identifier for pod events lookup', {
          uid: 'Provide uid or name',
        })
      }

      const params = buildQueryParams(searchParams, ['uid', 'name'])
      const result = await listEventsForResource({
        namespace,
        uid,
        name: nameParam,
        params,
        kind: 'Pod',
      })
      return createDataResponse(result)
    }

    throw new NotFoundError('Pod resource path')
  } catch (error) {
    return createErrorResponse(error, 'pods')
  }
}
