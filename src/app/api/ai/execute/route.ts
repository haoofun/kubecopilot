import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  createSuccessResponse,
  createErrorResponse,
} from '@infra-http/response'
import { ValidationError } from '@infra-http/error'
import { executeOperationPlan } from '@/lib/operation-plan/service'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'

/**
 * Describes the fields the observability board must provide when executing an AI-generated operation plan, ensuring actions
 * stay tied to the originating user, Kubernetes resource version, and idempotency key for safe retries.
 */
const executeSchema = z.object({
  planId: z.string().min(1),
  actor: z.string().min(1).default('user:unknown'),
  resourceVersion: z.string().min(1),
  idempotencyKey: z.string().min(1),
})

/**
 * POST /api/ai/execute validates the execution payload and triggers the operation-plan service so the AI flow can apply
 * Kubernetes changes in a controlled, auditable manner.
 */
const handleExecutePost = async (request: NextRequest) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return createErrorResponse(
      new ValidationError('Request body must be valid JSON'),
      'ai/execute',
    )
  }

  const result = executeSchema.safeParse(payload)

  if (!result.success) {
    return createErrorResponse(
      new ValidationError('Invalid execution payload', {
        issues: result.error.issues.map((issue) => issue.message).join('; '),
      }),
      'ai/execute',
    )
  }

  try {
    const plan = await executeOperationPlan(result.data)
    return createSuccessResponse({ plan })
  } catch (error) {
    return createErrorResponse(error, 'ai/execute')
  }
}

export const POST = withApiTelemetry(
  { route: 'api/ai/execute', category: 'AI' },
  handleExecutePost,
)
