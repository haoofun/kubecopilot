import { randomUUID } from 'crypto'

import type {
  OperationPlan as OperationPlanModel,
  OperationPlanStep as OperationPlanStepModel,
} from '@/generated/prisma'
import { Prisma } from '@/generated/prisma'
import { ValidationError, NotFoundError } from '@infra-http/error'

import type {
  JsonPatchOperation,
  OperationPlan,
  OperationPlanRisk,
  OperationPlanStep,
} from './types'
import { evaluatePlanRisk } from './risk-engine'
import { annotateRiskWithPromptMetadata } from './risk-annotator'
import { recordAuditEvent } from './audit'
import { prisma } from '@/lib/prisma'

/** Input collected when AI drafts a plan and the operator reviews it inside the observability workflow. */
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

/** Parameters required to execute an approved plan, ensuring resource + idempotency checks succeed. */
export interface ExecutePlanInput {
  planId: string
  actor: string
  resourceVersion: string
  idempotencyKey: string
}

type PlanWithRelations = OperationPlanModel & {
  steps: OperationPlanStepModel[]
}

/** Maps the Prisma representation into the domain OperationPlan structure consumed by API routes. */
function mapPlanFromModel(plan: PlanWithRelations): OperationPlan {
  const sortedSteps = [...plan.steps].sort((a, b) => a.stepOrder - b.stepOrder)

  const parseJson = <T>(value: Prisma.JsonValue | null): T | null => {
    if (value === null) {
      return null
    }
    return value as T
  }

  const toArray = <T>(value: Prisma.JsonValue): T => {
    if (value === null) {
      return [] as unknown as T
    }
    return value as T
  }

  return {
    id: plan.id,
    version: plan.version,
    status: plan.status as OperationPlan['status'],
    action: plan.action as OperationPlan['action'],
    intent: plan.intent,
    aiRationale: plan.aiRationale,
    resource: {
      kind: plan.resourceKind,
      namespace: plan.resourceNamespace,
      name: plan.resourceName,
      uid: plan.resourceUid ?? undefined,
      resourceVersion: plan.resourceVersion ?? undefined,
      cluster: plan.resourceCluster ?? undefined,
      href: plan.resourceHref,
    },
    diff: {
      before: parseJson<Record<string, unknown>>(plan.diffBefore),
      patch: plan.diffPatch as JsonPatchOperation[],
      rollbackPatch:
        parseJson<JsonPatchOperation[]>(plan.diffRollbackPatch) ?? undefined,
      patchFormat: plan.diffPatchFormat as OperationPlan['diff']['patchFormat'],
    },
    steps: sortedSteps.map((step) => ({
      id: step.id,
      action: step.action as OperationPlanStep['action'],
      description: step.description,
      patch: parseJson<JsonPatchOperation[]>(step.patch) ?? undefined,
      rollbackPatch:
        parseJson<JsonPatchOperation[]>(step.rollbackPatch) ?? undefined,
    })),
    risk: {
      level: plan.riskLevel as OperationPlanRisk['level'],
      rationale: plan.riskRationale,
      score: plan.riskScore ?? null,
      factors: toArray<OperationPlanRisk['factors']>(plan.riskFactors),
      sloBudgetImpact: (plan.riskSloBudgetImpact ??
        undefined) as OperationPlanRisk['sloBudgetImpact'],
      postConditions: toArray<OperationPlanRisk['postConditions']>(
        plan.riskPostConditions,
      ),
    },
    audit: {
      requestedBy: plan.requestedBy,
      confirmedBy: plan.confirmedBy ?? null,
      executedBy: plan.executedBy ?? 'system',
      idempotencyKey: plan.idempotencyKey ?? undefined,
      sourcePromptId: plan.sourcePromptId ?? undefined,
      timestamps: {
        createdAt: plan.createdAt.toISOString(),
        confirmedAt: plan.confirmedAt?.toISOString() ?? null,
        executedAt: plan.executedAt?.toISOString() ?? null,
        failedAt: plan.failedAt?.toISOString() ?? null,
        revertedAt: plan.revertedAt?.toISOString() ?? null,
      },
    },
  }
}

/**
 * Persists a new plan, evaluates risk, stores steps, and records an audit event so the board can surface pending changes.
 */
export async function draftOperationPlan(
  input: DraftPlanInput,
): Promise<OperationPlan> {
  const id = randomUUID()

  const idempotencyKey =
    input.idempotencyKey ??
    `plan-${input.resource.namespace}-${input.resource.name}-${Date.now()}`

  const baseRisk = evaluatePlanRisk({
    action: input.action,
    namespace: input.resource.namespace,
    resourceKind: input.resource.kind,
    diff: input.diff,
    steps: input.steps,
  })

  const risk = await annotateRiskWithPromptMetadata(baseRisk, {
    promptId: input.sourcePromptId,
  })

  const planRecord = await prisma.operationPlan.create({
    data: {
      id,
      version: input.version ?? '1',
      status: 'pending',
      action: input.action,
      intent: input.intent,
      aiRationale: input.aiRationale,
      resourceKind: input.resource.kind,
      resourceNamespace: input.resource.namespace,
      resourceName: input.resource.name,
      resourceUid: input.resource.uid ?? null,
      resourceVersion: input.resource.resourceVersion ?? null,
      resourceCluster: input.resource.cluster ?? null,
      resourceHref: input.resource.href,
      diffBefore: (input.diff.before ?? null) as Prisma.JsonValue,
      diffPatch: input.diff.patch as Prisma.JsonValue,
      diffPatchFormat: input.diff.patchFormat,
      diffRollbackPatch: (input.diff.rollbackPatch ?? null) as Prisma.JsonValue,
      riskLevel: risk.level,
      riskRationale: risk.rationale,
      riskScore: risk.score,
      riskFactors: risk.factors as Prisma.JsonValue,
      riskSloBudgetImpact: risk.sloBudgetImpact ?? null,
      riskPostConditions: risk.postConditions as Prisma.JsonValue,
      requestedBy: input.requestedBy,
      confirmedBy: null,
      executedBy: 'system',
      idempotencyKey,
      sourcePromptId: input.sourcePromptId ?? null,
      steps: {
        create: input.steps.map((step, index) => ({
          id: step.id,
          stepOrder: index,
          action: step.action,
          description: step.description,
          patch: (step.patch ?? null) as Prisma.JsonValue,
          rollbackPatch: (step.rollbackPatch ?? null) as Prisma.JsonValue,
        })),
      },
    },
    include: {
      steps: true,
    },
  })

  await recordAuditEvent({
    type: 'plan.generated',
    planId: planRecord.id,
    actor: input.requestedBy,
    metadata: {
      action: planRecord.action,
      namespace: planRecord.resourceNamespace,
      name: planRecord.resourceName,
    },
  })

  return mapPlanFromModel(planRecord)
}

/**
 * Marks a plan as executed after verifying resource_version + idempotency, then records audit events for traceability.
 */
export async function executeOperationPlan(
  input: ExecutePlanInput,
): Promise<OperationPlan> {
  const planRecord = await prisma.operationPlan.findUnique({
    where: { id: input.planId },
    include: { steps: true },
  })
  if (!planRecord) {
    throw new NotFoundError('OperationPlan', input.planId)
  }

  const expectedResourceVersion = planRecord.resourceVersion
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

  const expectedIdempotencyKey = planRecord.idempotencyKey
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

  await recordAuditEvent({
    type: 'plan.execution.attempt',
    planId: planRecord.id,
    actor: input.actor,
    metadata: {
      action: planRecord.action,
      namespace: planRecord.resourceNamespace,
      name: planRecord.resourceName,
    },
  })

  const now = new Date()

  const updatedPlan = await prisma.operationPlan.update({
    where: { id: planRecord.id },
    data: {
      status: 'executed',
      confirmedBy: planRecord.confirmedBy ?? input.actor,
      executedBy: input.actor,
      confirmedAt: planRecord.confirmedAt ?? now,
      executedAt: now,
    },
    include: { steps: true },
  })

  await recordAuditEvent({
    type: 'plan.execution.success',
    planId: planRecord.id,
    actor: input.actor,
    metadata: {
      action: planRecord.action,
      namespace: planRecord.resourceNamespace,
      name: planRecord.resourceName,
    },
  })

  return mapPlanFromModel(updatedPlan)
}

/**
 * Fails a plan when reviewers dismiss it or execution is aborted; best-effort update that ignores missing records.
 */
export async function dismissPlan(planId: string, actor: string) {
  try {
    await prisma.operationPlan.update({
      where: { id: planId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        confirmedBy: actor,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return
    }
    throw error
  }

  await recordAuditEvent({
    type: 'plan.dismissed',
    planId,
    actor,
  })
}
