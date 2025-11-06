'use client'

import { ShieldAlert, ShieldCheck, ShieldHalf } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OperationPlanRiskLevel } from '@/lib/operation-plan/types'

const riskTone: Record<
  OperationPlanRiskLevel,
  {
    label: string
    badgeClass: string
    icon: typeof ShieldCheck
  }
> = {
  low: {
    label: 'Low risk',
    badgeClass:
      'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/20 dark:text-emerald-300',
    icon: ShieldCheck,
  },
  medium: {
    label: 'Medium risk',
    badgeClass:
      'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/20 dark:text-amber-300',
    icon: ShieldHalf,
  },
  high: {
    label: 'High risk',
    badgeClass:
      'border-orange-200 bg-orange-500/10 text-orange-700 dark:border-orange-900/50 dark:bg-orange-500/20 dark:text-orange-300',
    icon: ShieldAlert,
  },
}

export function RiskBadge({
  tier,
  className,
  children,
}: {
  tier: OperationPlanRiskLevel
  className?: string
  children?: React.ReactNode
}) {
  const tone = riskTone[tier]
  const Icon = tone.icon

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1.5 border text-xs font-medium',
        tone.badgeClass,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{children ?? tone.label}</span>
    </Badge>
  )
}

export const getRiskToneLabel = (tier: OperationPlanRiskLevel) =>
  riskTone[tier].label
