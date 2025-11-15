import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  createSuccessResponse,
  createErrorResponse,
} from '@infra-http/response'
import { ValidationError } from '@infra-http/error'
import { draftOperationPlan, dismissPlan } from '@/lib/operation-plan/service'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'
import type {
  JsonPatchOperation,
  OperationPlanAction,
  OperationPlanDiffSnapshot,
  OperationPlanResourceRef,
  OperationPlanStep,
} from '@/lib/operation-plan/types'

/** JSON Patch operation used by the board to describe how Kubernetes manifests should change. */
const patchSchema: z.ZodType<JsonPatchOperation> = z.object({
  op: z.enum(['add', 'remove', 'replace']),
  path: z.string().min(1),
  value: z.unknown().optional(),
})

/** Describes each actionable step the AI proposes, aligning with Kubernetes verbs like create/update/delete. */
const stepSchema: z.ZodType<OperationPlanStep> = z.object({
  id: z.string().min(1),
  action: z.enum(['create', 'update', 'delete', 'scale', 'restart']),
  description: z.string().min(1),
  patch: z.array(patchSchema).optional(),
  rollbackPatch: z.array(patchSchema).optional(),
})

/** Snapshot of the before/after manifest plus rollback data so reviewers know exactly how the cluster changes. */
const diffSchema: z.ZodType<OperationPlanDiffSnapshot> = z.object({
  before: z.record(z.unknown()).nullable().optional(),
  patch: z.array(patchSchema).min(1),
  rollbackPatch: z.array(patchSchema).optional(),
  patchFormat: z.enum(['rfc6902', 'strategic-merge']).default('rfc6902'),
})

/** Identifies the Kubernetes resource the plan applies to, keeping intent tied to namespace/name/uid. */
const resourceSchema: z.ZodType<OperationPlanResourceRef> = z.object({
  kind: z.string().min(1),
  namespace: z.string().min(1),
  name: z.string().min(1),
  uid: z.string().optional(),
  resourceVersion: z.string().min(1),
  cluster: z.string().optional(),
  href: z.string().min(1),
})

/** Full payload required to draft a plan, mirroring the context the board collects from AI responders. */
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

/** Schema for dismissing a pending plan, capturing who dismissed it for audit trails. */
const planDismissSchema = z.object({
  planId: z.string().min(1),
  actor: z.string().min(1).default('user:unknown'),
})

/**
 * POST /api/ai/plan validates an AI-authored plan draft so SREs can review structured Kubernetes diffs before execution.
 */
const handlePlanPost = async (request: NextRequest) => {
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
    const plan = await draftOperationPlan(result.data)
    return createSuccessResponse({ plan })
  } catch (error) {
    return createErrorResponse(error, 'ai/plan')
  }
}

export const POST = withApiTelemetry(
  { route: 'api/ai/plan', category: 'AI' },
  handlePlanPost,
)

/**
 * DELETE /api/ai/plan lets operators dismiss a plan, ensuring the AI backlog reflects the board's review decisions.
 */
const handlePlanDelete = async (request: NextRequest) => {
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

  await dismissPlan(result.data.planId, result.data.actor)
  return createSuccessResponse({ dismissed: true })
}

export const DELETE = withApiTelemetry(
  { route: 'api/ai/plan', category: 'AI' },
  handlePlanDelete,
)
