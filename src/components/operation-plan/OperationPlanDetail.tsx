'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, CalendarClock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InfoRow } from '@/components/shared/InfoRow'
import { PlanConfirmModal, RiskBadge } from '@/components/plan-confirm-modal'
import type { OperationPlan } from '@/lib/operation-plan/types'
import {
  computeAfterState,
  describeOperation,
} from '@/components/operation-plan/utils'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const statusTone: Record<
  OperationPlan['status'],
  { label: string; badgeClass: string }
> = {
  pending: {
    label: 'Pending review',
    badgeClass: 'bg-amber-500/10 text-amber-700',
  },
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-emerald-500/10 text-emerald-700',
  },
  executed: {
    label: 'Executed',
    badgeClass: 'bg-muted text-foreground',
  },
  failed: {
    label: 'Failed',
    badgeClass: 'bg-red-500/10 text-red-700',
  },
  reverted: {
    label: 'Reverted',
    badgeClass: 'bg-muted text-muted-foreground',
  },
}

const formatJson = (value: unknown) =>
  value === null || value === undefined
    ? String(value)
    : typeof value === 'object'
      ? JSON.stringify(value, null, 2)
      : String(value)

const formatTimestamp = (value: string | null) =>
  value ? dateFormatter.format(new Date(value)) : '—'

const buildTimeline = (plan: OperationPlan) => {
  const items: {
    label: string
    actor: string
    timestamp: string | null
    description?: string
  }[] = [
    {
      label: 'Plan drafted',
      actor: plan.audit.requestedBy,
      timestamp: plan.audit.timestamps.createdAt,
      description: plan.intent,
    },
  ]

  if (plan.audit.confirmedBy || plan.audit.timestamps.confirmedAt) {
    items.push({
      label: 'Human confirmation',
      actor: plan.audit.confirmedBy ?? '—',
      timestamp: plan.audit.timestamps.confirmedAt,
    })
  }

  if (plan.audit.timestamps.executedAt) {
    items.push({
      label: 'Execution',
      actor: plan.audit.executedBy,
      timestamp: plan.audit.timestamps.executedAt,
    })
  }

  if (plan.audit.timestamps.failedAt) {
    items.push({
      label: 'Execution failed',
      actor: plan.audit.executedBy,
      timestamp: plan.audit.timestamps.failedAt,
    })
  }

  if (plan.audit.timestamps.revertedAt) {
    items.push({
      label: 'Rollback applied',
      actor: plan.audit.executedBy,
      timestamp: plan.audit.timestamps.revertedAt,
    })
  }

  return items
}

export function OperationPlanDetail({ plan }: { plan: OperationPlan }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const structuredChanges = useMemo(
    () =>
      plan.diff.patch.map((operation, index) => ({
        id: `${operation.op}-${operation.path}-${index}`,
        ...operation,
        value: formatJson(operation.value),
      })),
    [plan.diff.patch],
  )

  const afterState = useMemo(() => computeAfterState(plan), [plan])
  const timeline = useMemo(() => buildTimeline(plan), [plan])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/operation-plans"
            className="text-muted-foreground hover:text-primary text-xs font-medium tracking-wide uppercase"
          >
            <ArrowLeft className="mr-1 inline h-3.5 w-3.5" aria-hidden /> Back
            to plans
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl leading-tight font-semibold">
              {describeOperation(plan)}
            </h1>
            <p className="text-muted-foreground text-sm leading-6">
              {plan.intent}
            </p>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="font-mono text-xs">{plan.id}</span>
              <span aria-hidden>·</span>
              <span>
                Requested {formatTimestamp(plan.audit.timestamps.createdAt)}
              </span>
              <span aria-hidden>·</span>
              <span>By {plan.audit.requestedBy}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <RiskBadge tier={plan.risk.level} />
          <Badge className={statusTone[plan.status].badgeClass}>
            {statusTone[plan.status].label}
          </Badge>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="sm:px-6"
            disabled={plan.status !== 'pending'}
          >
            Review plan
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="bg-background rounded-2xl border p-6 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Operation context
          </h2>
          <dl className="mt-4 space-y-3">
            <InfoRow
              label="Target resource"
              value={
                <Link
                  href={plan.resource.href}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {plan.resource.kind} · {plan.resource.namespace}/
                  {plan.resource.name}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              }
              helper={
                plan.resource.cluster
                  ? `Cluster: ${plan.resource.cluster}`
                  : undefined
              }
            />
            <InfoRow
              label="Action"
              value={plan.action}
              helper={`Schema version ${plan.version}`}
            />
            <InfoRow label="AI rationale" value={plan.aiRationale} />
            <InfoRow
              label="Diff format"
              value={plan.diff.patchFormat.toUpperCase()}
            />
          </dl>
        </section>

        <section className="bg-background rounded-2xl border p-6 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Risk & guardrails
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-foreground/90 leading-6">
              {plan.risk.rationale}
            </p>
            <div className="grid gap-3 text-xs">
              <div>
                <p className="text-muted-foreground tracking-wide uppercase">
                  Risk score
                </p>
                <p>
                  {plan.risk.score !== null ? plan.risk.score.toFixed(2) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground tracking-wide uppercase">
                  SLO budget impact
                </p>
                <p className="capitalize">
                  {plan.risk.sloBudgetImpact ?? 'unknown'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground tracking-wide uppercase">
                  Factors
                </p>
                <p>
                  {plan.risk.factors.length > 0
                    ? plan.risk.factors.join(', ')
                    : '—'}
                </p>
              </div>
            </div>
            {plan.risk.postConditions.length > 0 ? (
              <div className="text-muted-foreground text-xs">
                Post-conditions to verify:
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {plan.risk.postConditions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="bg-background rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Proposed patch
          </h2>
          <Badge variant="outline">
            {structuredChanges.length} change(s) · {plan.diff.patchFormat}
          </Badge>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border">
          {structuredChanges.length === 0 ? (
            <div className="text-muted-foreground p-4 text-sm">
              No diff recorded.
            </div>
          ) : (
            <div className="divide-border divide-y text-sm">
              <div className="bg-muted/40 text-muted-foreground grid grid-cols-4 gap-4 px-4 py-2 text-xs font-semibold tracking-wide uppercase">
                <div>Path</div>
                <div>Operation</div>
                <div className="col-span-2">Value</div>
              </div>
              {structuredChanges.map((change) => (
                <div
                  key={change.id}
                  className="grid grid-cols-4 gap-4 px-4 py-3 text-xs sm:text-sm"
                >
                  <div className="font-mono text-[11px] sm:text-xs">
                    {change.path}
                  </div>
                  <div className="text-muted-foreground tracking-wide uppercase">
                    {change.op}
                  </div>
                  <div className="col-span-2">
                    <pre className="bg-muted/30 max-h-48 overflow-auto rounded-lg border p-3 text-xs">
                      {change.value}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-muted-foreground text-xs tracking-wide uppercase">
              Before snapshot
            </h3>
            <pre className="bg-muted/30 mt-2 max-h-72 overflow-auto rounded-lg border p-3 text-xs">
              {plan.diff.before
                ? JSON.stringify(plan.diff.before, null, 2)
                : 'N/A'}
            </pre>
          </div>
          <div>
            <h3 className="text-muted-foreground text-xs tracking-wide uppercase">
              After snapshot
            </h3>
            <pre className="bg-muted/30 mt-2 max-h-72 overflow-auto rounded-lg border p-3 text-xs">
              {afterState
                ? JSON.stringify(afterState, null, 2)
                : 'Failed to compute diff'}
            </pre>
          </div>
        </div>
      </section>

      <section className="bg-background rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Execution steps
          </h2>
          <Badge variant="outline">{plan.steps.length} step(s)</Badge>
        </div>
        <ol className="mt-4 space-y-4">
          {plan.steps.map((step) => (
            <li key={step.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium tracking-wide">
                    {step.description}
                  </p>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    {step.action}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {step.id}
                </Badge>
              </div>
              {step.patch && step.patch.length > 0 ? (
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-muted-foreground tracking-wide uppercase">
                    Patch
                  </p>
                  <pre className="bg-muted/30 max-h-40 overflow-auto rounded-lg border p-3">
                    {JSON.stringify(step.patch, null, 2)}
                  </pre>
                </div>
              ) : null}
              {step.rollbackPatch && step.rollbackPatch.length > 0 ? (
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-muted-foreground tracking-wide uppercase">
                    Rollback patch
                  </p>
                  <pre className="bg-muted/30 max-h-40 overflow-auto rounded-lg border p-3">
                    {JSON.stringify(step.rollbackPatch, null, 2)}
                  </pre>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-background rounded-2xl border p-6 shadow-sm">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Rollback & safeguards
        </h2>
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-foreground/90 leading-6">
            Rollback patch (applied if execution fails):
          </p>
          <pre className="bg-muted/30 max-h-48 overflow-auto rounded-lg border p-3 text-xs">
            {plan.diff.rollbackPatch
              ? JSON.stringify(plan.diff.rollbackPatch, null, 2)
              : 'No rollback patch supplied.'}
          </pre>
          {plan.risk.postConditions.length > 0 ? (
            <div className="text-muted-foreground text-xs">
              Post-execution checks:
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {plan.risk.postConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-background rounded-2xl border p-6 shadow-sm">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Audit timeline
        </h2>
        <ol className="mt-4 space-y-3 text-sm">
          {timeline.map((event) => (
            <li
              key={`${event.label}-${event.timestamp ?? 'pending'}`}
              className="flex items-start gap-2"
            >
              <CalendarClock
                className="text-muted-foreground mt-0.5 h-4 w-4"
                aria-hidden
              />
              <div>
                <div className="font-medium tracking-wide">{event.label}</div>
                <div className="text-muted-foreground text-xs">
                  {formatTimestamp(event.timestamp)} · {event.actor}
                </div>
                {event.description ? (
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {event.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="text-muted-foreground mt-4 text-xs">
          Prompt source: {plan.audit.sourcePromptId ?? '—'} · Idempotency key:{' '}
          <span className="font-mono">{plan.audit.idempotencyKey ?? '—'}</span>
        </div>
      </section>

      <PlanConfirmModal
        plan={plan}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}
