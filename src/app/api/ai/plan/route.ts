import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/error'
import { draftOperationPlan, dismissPlan } from '@/lib/operation-plan/service'
import type {
  JsonPatchOperation,
  OperationPlanAction,
  OperationPlanDiffSnapshot,
  OperationPlanResourceRef,
  OperationPlanStep,
} from '@/lib/operation-plan/types'

const patchSchema: z.ZodType<JsonPatchOperation> = z.object({
  op: z.enum(['add', 'remove', 'replace']),
  path: z.string().min(1),
  value: z.unknown().optional(),
})

const stepSchema: z.ZodType<OperationPlanStep> = z.object({
  id: z.string().min(1),
  action: z.enum(['create', 'update', 'delete', 'scale', 'restart']),
  description: z.string().min(1),
  patch: z.array(patchSchema).optional(),
  rollbackPatch: z.array(patchSchema).optional(),
})

const diffSchema: z.ZodType<OperationPlanDiffSnapshot> = z.object({
  before: z.record(z.unknown()).nullable().optional(),
  patch: z.array(patchSchema).min(1),
  rollbackPatch: z.array(patchSchema).optional(),
  patchFormat: z.enum(['rfc6902', 'strategic-merge']).default('rfc6902'),
})

const resourceSchema: z.ZodType<OperationPlanResourceRef> = z.object({
  kind: z.string().min(1),
  namespace: z.string().min(1),
  name: z.string().min(1),
  uid: z.string().optional(),
  resourceVersion: z.string().min(1),
  cluster: z.string().optional(),
  href: z.string().min(1),
})

const planDraftSchema = z.object({
  action: z.enum([
    'create',
    'update',
    'delete',
    'scale',
    'restart',
  ]) as z.ZodType<OperationPlanAction>,
  intent: z.string().min(1),
  aiRationale: z.string().min(1),
  requestedBy: z.string().min(1).default('user:unknown'),
  resource: resourceSchema,
  diff: diffSchema,
  steps: z.array(stepSchema).min(1),
  idempotencyKey: z.string().min(1).optional(),
  sourcePromptId: z.string().optional(),
  version: z.string().optional(),
})

const planDismissSchema = z.object({
  planId: z.string().min(1),
  actor: z.string().min(1).default('user:unknown'),
})

export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return createErrorResponse(
      new ValidationError('Request body must be valid JSON'),
      'ai/plan',
    )
  }

  const result = planDraftSchema.safeParse(payload)

  if (!result.success) {
    return createErrorResponse(
      new ValidationError('Invalid plan draft payload', {
        issues: result.error.issues.map((issue) => issue.message).join('; '),
      }),
      'ai/plan',
    )
  }

  try {
    const plan = draftOperationPlan(result.data)
    return createSuccessResponse({ plan })
  } catch (error) {
    return createErrorResponse(error, 'ai/plan')
  }
}

export async function DELETE(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return createErrorResponse(
      new ValidationError('Request body must be valid JSON'),
      'ai/plan',
    )
  }

  const result = planDismissSchema.safeParse(payload)

  if (!result.success) {
    return createErrorResponse(
      new ValidationError('Invalid dismissal payload', {
        issues: result.error.issues.map((issue) => issue.message).join('; '),
      }),
      'ai/plan',
    )
  }

  dismissPlan(result.data.planId, result.data.actor)
  return createSuccessResponse({ dismissed: true })
}
