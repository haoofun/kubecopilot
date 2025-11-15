import { getPromptMetadata } from '@domain-ai/prompt-registry'
import type { OperationPlanRisk } from './types'

type RiskTier = 'low' | 'medium' | 'high'

const tierFactorMap: Record<RiskTier, string> = {
  low: 'prompt_low_risk',
  medium: 'prompt_medium_risk',
  high: 'prompt_high_risk',
}

const tierRationaleMap: Record<RiskTier, string> = {
  low: 'Prompt registry flags this instruction as low risk.',
  medium:
    'Prompt registry flags this instruction as medium risk; ensure approval flow remains enabled.',
  high: 'Prompt registry flags this instruction as high risk; human confirmation is required.',
}

const tierPostConditionMap: Partial<Record<RiskTier, string>> = {
  high: 'Confirm post-change telemetry and record human approval in the audit log due to high-risk prompt classification.',
}

const tierMinimumScore: Record<RiskTier, number> = {
  low: 0.35,
  medium: 0.55,
  high: 0.75,
}

const tierMinimumImpact: Record<RiskTier, 'low' | 'medium' | 'high'> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
}

/**
 * Enriches the computed risk with metadata from the prompt registry; high-risk prompts automatically elevate scores,
 * factors, and post-conditions so reviewers see the AI provenance in the observability UI.
 */
export async function annotateRiskWithPromptMetadata(
  risk: OperationPlanRisk,
  options: { promptId?: string | null },
): Promise<OperationPlanRisk> {
  if (!options.promptId) {
    return risk
  }

  const metadata = await getPromptMetadata(options.promptId)
  if (!metadata) {
    return risk
  }

  const factors = new Set(risk.factors)
  const postConditions = new Set(risk.postConditions)

  const tier = metadata.riskTier
  factors.add(tierFactorMap[tier])

  const rationaleParts = [risk.rationale, tierRationaleMap[tier]].filter(
    Boolean,
  )

  const minimumScore = tierMinimumScore[tier]
  const nextScore =
    risk.score === null ? minimumScore : Math.max(risk.score, minimumScore)

  const minimumImpact = tierMinimumImpact[tier]
  const nextImpact =
    risk.sloBudgetImpact === undefined
      ? minimumImpact
      : tierPriority(risk.sloBudgetImpact) >= tierPriority(minimumImpact)
        ? risk.sloBudgetImpact
        : minimumImpact

  const nextLevel = elevateRiskLevel(risk.level, tier)

  const extraPostCondition = tierPostConditionMap[tier]
  if (extraPostCondition) {
    postConditions.add(extraPostCondition)
  }

  return {
    ...risk,
    level: nextLevel,
    score: nextScore,
    sloBudgetImpact: nextImpact,
    factors: Array.from(factors),
    postConditions: Array.from(postConditions),
    rationale: rationaleParts.join(' '),
  }
}

const riskLevelOrder = ['low', 'medium', 'high'] as const

function elevateRiskLevel(
  current: OperationPlanRisk['level'],
  tier: RiskTier,
): OperationPlanRisk['level'] {
  const currentIndex = riskLevelOrder.indexOf(current)
  const targetIndex = riskLevelOrder.indexOf(tier)
  return riskLevelOrder[Math.max(currentIndex, targetIndex)]
}

function tierPriority(impact: OperationPlanRisk['sloBudgetImpact']): number {
  if (impact === undefined) {
    return 0
  }
  switch (impact) {
    case 'low':
      return 1
    case 'medium':
      return 2
    case 'high':
      return 3
    default:
      return 0
  }
}
