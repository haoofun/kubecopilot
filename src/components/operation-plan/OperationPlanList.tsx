'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlanConfirmModal, RiskBadge } from '@/components/plan-confirm-modal'
import { describeOperation } from '@/components/operation-plan/utils'
import type { OperationPlan } from '@/lib/operation-plan/types'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const statusTone: Record<
  OperationPlan['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending review',
    className:
      'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/20 dark:text-amber-300',
  },
  confirmed: {
    label: 'Confirmed',
    className:
      'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  executed: {
    label: 'Executed',
    className:
      'border-muted bg-muted/40 text-foreground dark:border-muted/40 dark:bg-muted/20',
  },
  failed: {
    label: 'Failed',
    className:
      'border-red-200 bg-red-500/10 text-red-700 dark:border-red-900/60 dark:bg-red-500/20 dark:text-red-300',
  },
  reverted: {
    label: 'Reverted',
    className:
      'border-muted bg-muted text-muted-foreground dark:border-muted/60 dark:bg-muted/20',
  },
}

export function OperationPlanList({ plans }: { plans: OperationPlan[] }) {
  const [selectedPlan, setSelectedPlan] = useState<OperationPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const sortedPlans = useMemo(
    () =>
      plans
        .slice()
        .sort(
          (a, b) =>
            new Date(b.audit.timestamps.createdAt).getTime() -
            new Date(a.audit.timestamps.createdAt).getTime(),
        ),
    [plans],
  )

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border">
        <div className="hidden md:block">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlans.map((plan) => (
                <tr key={plan.id} className="border-t last:border-b-0">
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/operation-plans/${plan.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {describeOperation(plan)}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {plan.intent}
                      </p>
                      <span className="text-muted-foreground font-mono text-xs">
                        {plan.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {plan.resource.kind} · {plan.resource.namespace}/
                        {plan.resource.name}
                      </div>
                      <Link
                        href={plan.resource.href}
                        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs"
                      >
                        View resource
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <RiskBadge tier={plan.risk.level} />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge
                      variant="outline"
                      className={statusTone[plan.status].className}
                    >
                      {statusTone[plan.status].label}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-4 align-top text-sm">
                    <div className="space-y-1">
                      <span>
                        {dateFormatter.format(
                          new Date(plan.audit.timestamps.createdAt),
                        )}
                      </span>
                      <span className="block text-xs">
                        {plan.audit.requestedBy}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={plan.status !== 'pending'}
                        onClick={() => {
                          setSelectedPlan(plan)
                          setIsModalOpen(true)
                        }}
                      >
                        Review
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                      >
                        <Link
                          href={`/operation-plans/${plan.id}`}
                          className="inline-flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                          Detail
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-border flex flex-col gap-4 p-4 md:hidden">
          {sortedPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-background rounded-2xl border p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <h3 className="text-base leading-tight font-semibold">
                    {describeOperation(plan)}
                  </h3>
                  <p className="text-muted-foreground text-sm">{plan.intent}</p>
                  <div className="text-muted-foreground text-xs">
                    {plan.resource.kind} · {plan.resource.namespace}/
                    {plan.resource.name}
                  </div>
                </div>
                <RiskBadge tier={plan.risk.level} />
              </div>
              <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span>
                  {dateFormatter.format(
                    new Date(plan.audit.timestamps.createdAt),
                  )}
                </span>
                <span aria-hidden>•</span>
                <span>{plan.audit.requestedBy}</span>
                <span aria-hidden>•</span>
                <span>{statusTone[plan.status].label}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={plan.status !== 'pending'}
                  onClick={() => {
                    setSelectedPlan(plan)
                    setIsModalOpen(true)
                  }}
                >
                  Review
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground flex-1"
                >
                  <Link
                    href={`/operation-plans/${plan.id}`}
                    className="inline-flex items-center justify-center gap-1"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    Detail
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PlanConfirmModal
        plan={selectedPlan}
        open={isModalOpen && Boolean(selectedPlan)}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}
