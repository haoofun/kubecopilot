import { randomUUID } from 'crypto'

import { ValidationError, NotFoundError } from '@/lib/api/error'

import type { OperationPlan, OperationPlanStep } from './types'
import { evaluatePlanRisk } from './risk-engine'
import { recordAuditEvent } from './audit'

export interface DraftPlanInput {
  action: OperationPlan['action']
  intent: string
  aiRationale: string
  requestedBy: string
  resource: OperationPlan['resource']
  diff: OperationPlan['diff']
  steps: OperationPlanStep[]
  idempotencyKey?: string
  sourcePromptId?: string
  version?: string
}

export interface ExecutePlanInput {
  planId: string
  actor: string
  resourceVersion: string
  idempotencyKey: string
}

const planStore = new Map<string, OperationPlan>()

export function getPlan(planId: string) {
  return planStore.get(planId) ?? null
}

export function draftOperationPlan(input: DraftPlanInput): OperationPlan {
  const id = randomUUID()
  const now = new Date().toISOString()

  const idempotencyKey =
    input.idempotencyKey ??
    `plan-${input.resource.namespace}-${input.resource.name}-${Date.now()}`

  const risk = evaluatePlanRisk({
    action: input.action,
    namespace: input.resource.namespace,
    resourceKind: input.resource.kind,
    diff: input.diff,
    steps: input.steps,
  })

  const plan: OperationPlan = {
    id,
    version: input.version ?? '1',
    status: 'pending',
    action: input.action,
    intent: input.intent,
    aiRationale: input.aiRationale,
    resource: input.resource,
    diff: {
      before: input.diff.before ?? null,
      patch: input.diff.patch,
      rollbackPatch: input.diff.rollbackPatch,
      patchFormat: input.diff.patchFormat,
    },
    steps: input.steps,
    risk,
    audit: {
      requestedBy: input.requestedBy,
      confirmedBy: null,
      executedBy: 'system',
      idempotencyKey,
      sourcePromptId: input.sourcePromptId,
      timestamps: {
        createdAt: now,
        confirmedAt: null,
        executedAt: null,
        failedAt: null,
        revertedAt: null,
      },
    },
  }

  planStore.set(plan.id, plan)

  recordAuditEvent({
    type: 'plan.generated',
    planId: plan.id,
    actor: input.requestedBy,
    metadata: {
      action: plan.action,
      namespace: plan.resource.namespace,
      name: plan.resource.name,
    },
  })

  return plan
}

export function executeOperationPlan(input: ExecutePlanInput): OperationPlan {
  const plan = getPlan(input.planId)
  if (!plan) {
    throw new NotFoundError('OperationPlan', input.planId)
  }

  const expectedResourceVersion = plan.resource.resourceVersion
  if (!expectedResourceVersion) {
    throw new ValidationError('Plan is missing resource snapshot', {
      resourceVersion: 'Snapshot unavailable',
    })
  }

  if (expectedResourceVersion !== input.resourceVersion) {
    throw new ValidationError('Resource version drift detected', {
      resourceVersion: `Expected ${expectedResourceVersion}, received ${input.resourceVersion}`,
    })
  }

  const expectedIdempotencyKey = plan.audit.idempotencyKey
  if (!expectedIdempotencyKey) {
    throw new ValidationError('Plan is missing idempotency key', {
      idempotencyKey: 'Not assigned to plan',
    })
  }

  if (expectedIdempotencyKey !== input.idempotencyKey) {
    throw new ValidationError('Idempotency key mismatch', {
      idempotencyKey: `Expected ${expectedIdempotencyKey}, received ${input.idempotencyKey}`,
    })
  }

  recordAuditEvent({
    type: 'plan.execution.attempt',
    planId: plan.id,
    actor: input.actor,
    metadata: {
      action: plan.action,
      namespace: plan.resource.namespace,
      name: plan.resource.name,
    },
  })

  const now = new Date().toISOString()

  const updatedPlan: OperationPlan = {
    ...plan,
    status: 'executed',
    audit: {
      ...plan.audit,
      confirmedBy: input.actor,
      executedBy: input.actor,
      timestamps: {
        ...plan.audit.timestamps,
        confirmedAt: plan.audit.timestamps.confirmedAt ?? now,
        executedAt: now,
      },
    },
  }

  planStore.set(plan.id, updatedPlan)

  recordAuditEvent({
    type: 'plan.execution.success',
    planId: plan.id,
    actor: input.actor,
    metadata: {
      action: plan.action,
      namespace: plan.resource.namespace,
      name: plan.resource.name,
    },
  })

  return updatedPlan
}

export function dismissPlan(planId: string, actor: string) {
  const plan = getPlan(planId)
  if (!plan) {
    return
  }

  recordAuditEvent({
    type: 'plan.dismissed',
    planId: plan.id,
    actor,
  })
}
