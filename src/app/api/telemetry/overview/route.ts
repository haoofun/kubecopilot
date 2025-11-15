import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  createErrorResponse,
} from '@infra-http/response'
import { ValidationError } from '@infra-http/error'

import { withApiTelemetry } from '@/lib/telemetry/api-logger'
import { getTelemetryOverview } from '@/lib/telemetry/metrics'
import { exportTelemetrySnapshot } from '@/lib/telemetry/exporter'

const MAX_WINDOW_MS = 72 * 60 * 60 * 1000

/**
 * GET /api/telemetry/overview returns a summarized window of cluster + AI telemetry so the observability board can chart usage trends.
 * Accepts an optional windowHours query, capped to 72h to keep snapshot exports manageable.
 */
const handler = async (request: NextRequest) => {
  const search = request.nextUrl.searchParams
  const windowHoursParam = search.get('windowHours')
  let windowHours = 24

  if (windowHoursParam) {
    const parsed = Number(windowHoursParam)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return createErrorResponse(
        new ValidationError('windowHours must be a positive number', {
          windowHours: 'positive number expected',
        }),
        'telemetry/overview',
      )
    }
    windowHours = parsed
  }

  const windowMs = windowHours * 60 * 60 * 1000
  if (windowMs > MAX_WINDOW_MS) {
    return createErrorResponse(
      new ValidationError('windowHours exceeds allowed window', {
        windowHours: 'Must be <= 72 hours',
      }),
      'telemetry/overview',
    )
  }

  try {
    const since = new Date(Date.now() - windowMs)
    const overview = await getTelemetryOverview({ since })
    await exportTelemetrySnapshot(overview)
    return createSuccessResponse({ overview })
  } catch (error) {
    return createErrorResponse(error, 'telemetry/overview')
  }
}

export const GET = withApiTelemetry(
  { route: 'api/telemetry/overview', category: 'K8S' },
  handler,
)
