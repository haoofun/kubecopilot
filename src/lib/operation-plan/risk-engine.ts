import type {
  OperationPlanAction,
  OperationPlanDiffSnapshot,
  OperationPlanRisk,
  OperationPlanRiskLevel,
  OperationPlanStep,
} from './types'

/** Normalized payload containing all plan inputs needed to calculate a risk score. */
interface RiskEvaluationContext {
  action: OperationPlanAction
  namespace: string
  resourceKind: string
  diff: OperationPlanDiffSnapshot
  steps: OperationPlanStep[]
}

const SAFE_NAMESPACES = new Set(['staging', 'dev', 'development', 'sandbox'])
const SAFE_KINDS = new Set(['Job', 'CronJob'])

const ACTION_BASELINE: Record<OperationPlanAction, number> = {
  create: 0.45,
  update: 0.6,
  delete: 0.85,
  scale: 0.55,
  restart: 0.3,
}

const actionLabel: Record<OperationPlanAction, string> = {
  create: 'resource creation',
  update: 'configuration update',
  delete: 'resource removal',
  scale: 'capacity adjustment',
  restart: 'rolling restart',
}

/** Heuristics that attach factor labels and adjust the baseline risk score. */
function detectRiskFactors(context: RiskEvaluationContext) {
  const factors: string[] = []
  let scoreDelta = 0

  if (!SAFE_NAMESPACES.has(context.namespace)) {
    factors.push('production_namespace')
    scoreDelta += 0.1
  } else {
    factors.push('sandbox_scope')
    scoreDelta -= 0.1
  }

  if (SAFE_KINDS.has(context.resourceKind)) {
    factors.push('ephemeral_kind')
    scoreDelta -= 0.05
  }

  const patchTouchingReplicas = context.diff.patch.some((operation) =>
    operation.path.includes('/spec/replicas'),
  )

  if (patchTouchingReplicas) {
    factors.push('replica_change')
    scoreDelta += 0.08
  }

  const imageChange = context.diff.patch.some(
    (operation) =>
      operation.path.includes('/containers') &&
      typeof operation.value === 'string' &&
      /:/.test(String(operation.value)),
  )

  if (imageChange) {
    factors.push('image_rollout')
    scoreDelta += 0.12
  }

  if (context.steps.length > 3) {
    factors.push('multi_step_plan')
    scoreDelta += 0.05
  }

  if (context.diff.rollbackPatch && context.diff.rollbackPatch.length > 0) {
    factors.push('rollback_available')
    scoreDelta -= 0.05
  }

  return { factors, scoreDelta }
}

function mapScoreToLevel(score: number): OperationPlanRiskLevel {
  if (score >= 0.7) {
    return 'high'
  }

  if (score >= 0.45) {
    return 'medium'
  }

  return 'low'
}

function deriveSloImpact(
  level: OperationPlanRiskLevel,
): OperationPlanRisk['sloBudgetImpact'] | undefined {
  switch (level) {
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    case 'low':
      return 'low'
    default:
      return undefined
  }
}

/**
 * Calculates a risk object that the observability board displays beside AI-generated plans, blending action baselines
 * with heuristics about namespaces, kinds, replica changes, image rollouts, and rollback availability.
 */
export function evaluatePlanRisk(
  context: RiskEvaluationContext,
): OperationPlanRisk {
  const baseline = ACTION_BASELINE[context.action] ?? 0.5
  const { factors, scoreDelta } = detectRiskFactors(context)
  const score = Math.min(1, Math.max(0, baseline + scoreDelta))
  const level = mapScoreToLevel(score)

  const rationaleParts = [
    `Action classified as ${actionLabel[context.action]}.`,
  ]

  if (SAFE_NAMESPACES.has(context.namespace)) {
    rationaleParts.push('Namespace is within change sandbox.')
  } else {
    rationaleParts.push('Namespace treated as production-tier surface.')
  }

  if (context.diff.rollbackPatch && context.diff.rollbackPatch.length > 0) {
    rationaleParts.push('Rollback patch supplied for contingency.')
  }

  if (factors.includes('image_rollout')) {
    rationaleParts.push('Container image change requires pod recycling.')
  }

  if (factors.includes('replica_change')) {
    rationaleParts.push(
      'Replica count mutation impacts live traffic distribution.',
    )
  }

  const rationale = rationaleParts.join(' ')

  const postConditions = [] as string[]
  if (level === 'high') {
    postConditions.push(
      'Monitor error budget burn for 60 minutes post execution.',
    )
  }
  if (factors.includes('image_rollout')) {
    postConditions.push(
      'Verify rollout pods become Ready before traffic shift.',
    )
  }
  if (factors.includes('replica_change')) {
    postConditions.push('Confirm HPA/metrics reflect new replica baseline.')
  }

  return {
    level,
    rationale,
    score,
    factors,
    sloBudgetImpact: deriveSloImpact(level) ?? 'medium',
    postConditions,
  }
}
