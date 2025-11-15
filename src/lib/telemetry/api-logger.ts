import type { NextRequest, NextResponse } from 'next/server'
import type { ApiRequestCategory } from '@/generated/prisma'

import { prisma } from '@/lib/prisma'

type RouteHandler<TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<NextResponse>

interface WithApiTelemetryOptions {
  route: string
  category: ApiRequestCategory
}

/**
 * Wraps an API route and records duration/status metadata so the observability board can chart backend performance
 * without adding telemetry boilerplate to every handler.
 */
export function withApiTelemetry<
  TArgs extends [NextRequest, ...unknown[]],
  THandler extends RouteHandler<TArgs>,
>(options: WithApiTelemetryOptions, handler: THandler): THandler {
  return (async (...args: TArgs) => {
    const [request] = args
    const start = performance.now()
    let statusCode = 500
    let response: NextResponse | undefined
    let caughtError: unknown

    try {
      response = await handler(...args)
      statusCode = response.status
      return response
    } catch (error) {
      caughtError = error
      throw error
    } finally {
      if (!response && !caughtError) {
        statusCode = 200
      }
      const duration = Math.round(performance.now() - start)
      persistApiLogSafe({
        route: options.route,
        category: options.category,
        method: request.method,
        statusCode,
        durationMs: duration,
        actor: request.headers.get('x-user-id') ?? undefined,
        path: request.nextUrl.pathname,
      })
    }
  }) as THandler
}

/** Fire-and-forget Prisma write; failures are logged but never bubble into API responses. */
function persistApiLogSafe(details: {
  route: string
  category: ApiRequestCategory
  method: string
  statusCode: number
  durationMs: number
  actor?: string
  path: string
}) {
  prisma.apiRequestLog
    .create({
      data: {
        route: details.route,
        method: details.method,
        statusCode: details.statusCode,
        durationMs: details.durationMs,
        category: details.category,
        actor: details.actor ?? null,
        metadata: {
          path: details.path,
        },
      },
    })
    .catch((error) => {
      console.error('[api-log] failed to persist request log', {
        error,
        route: details.route,
      })
    })
}
