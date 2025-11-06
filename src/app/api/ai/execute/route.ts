import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/error'
import { executeOperationPlan } from '@/lib/operation-plan/service'

const executeSchema = z.object({
  planId: z.string().min(1),
  actor: z.string().min(1).default('user:unknown'),
  resourceVersion: z.string().min(1),
  idempotencyKey: z.string().min(1),
})

export async function POST(request: NextRequest) {
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
    const plan = executeOperationPlan(result.data)
    return createSuccessResponse({ plan })
  } catch (error) {
    return createErrorResponse(error, 'ai/execute')
  }
}
