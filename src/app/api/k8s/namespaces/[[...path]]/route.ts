import { NextRequest } from 'next/server'

import { createDataResponse, createErrorResponse } from '@/lib/api/response'
import { ValidationError, NotFoundError } from '@/lib/api/error'
import {
  listNamespaces,
  getNamespaceDetail,
} from '@/lib/k8s/services/namespace.service'
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
      const result = await listNamespaces({ params })
      return createDataResponse(result)
    }

    if (segments.length === 1) {
      const [name] = segments
      const includeRaw = parseOptionalBoolean(searchParams.get('includeRaw'))
      const includeYaml = parseOptionalBoolean(searchParams.get('includeYaml'))

      const result = await getNamespaceDetail(name, {
        includeRaw,
        includeYaml,
      })
      return createDataResponse(result)
    }

    if (segments.length === 2 && segments[1] === 'events') {
      const [name] = segments
      const uid = searchParams.get('uid') ?? undefined
      const namespaceContext = searchParams.get('namespace') ?? name

      if (!uid && !name) {
        throw new ValidationError(
          'Missing namespace identifier for event lookup',
          {
            uid: 'Provide uid or name',
          },
        )
      }

      const params = buildQueryParams(searchParams, ['uid', 'namespace'])
      const result = await listEventsForResource({
        namespace: namespaceContext,
        uid,
        name,
        kind: 'Namespace',
        params,
      })
      return createDataResponse(result)
    }

    throw new NotFoundError('Namespace resource path')
  } catch (error) {
    return createErrorResponse(error, 'namespaces')
  }
}
