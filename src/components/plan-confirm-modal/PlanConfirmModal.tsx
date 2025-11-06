'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OperationPlan } from '@/lib/operation-plan/types'
import {
  computeAfterState,
  describeOperation,
} from '@/components/operation-plan/utils'
import { RiskBadge } from './risk'

const formatTimestamp = (timestamp: string | null) =>
  timestamp ? new Date(timestamp).toLocaleString() : null

export interface PlanConfirmModalProps {
  plan: OperationPlan | null
  open: boolean
  onOpenChange: (next: boolean) => void
  onApprove?: (plan: OperationPlan) => Promise<void> | void
  onReject?: (plan: OperationPlan) => Promise<void> | void
}

export function PlanConfirmModal({
  plan,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: PlanConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null)
  const isLoading = false

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  useEffect(() => {
    if (open) {
      confirmButtonRef.current?.focus()
      document.body.style.setProperty('overflow', 'hidden')
    } else {
      document.body.style.removeProperty('overflow')
    }
    return () => document.body.style.removeProperty('overflow')
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

  const structuredChanges = useMemo(() => {
    if (!plan) {
      return []
    }
    return plan.diff.patch.map((operation, index) => ({
      id: `${operation.op}-${operation.path}-${index}`,
      op: operation.op,
      path: operation.path,
      value:
        operation.value === null || operation.value === undefined
          ? String(operation.value)
          : typeof operation.value === 'object'
            ? JSON.stringify(operation.value, null, 2)
            : String(operation.value),
    }))
  }, [plan])

  const afterState = useMemo(
    () => (plan ? computeAfterState(plan) : null),
    [plan],
  )

  if (!plan || !open) {
    return null
  }

  const createdAt = formatTimestamp(plan.audit.timestamps.createdAt)
  const confirmedAt = formatTimestamp(plan.audit.timestamps.confirmedAt)
  const executedAt = formatTimestamp(plan.audit.timestamps.executedAt)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="operation-plan-title"
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center px-4 py-10 sm:py-16',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      style={{
        backgroundColor: open ? 'rgba(15, 23, 42, 0.45)' : 'transparent',
        backdropFilter: open ? 'blur(4px)' : undefined,
      }}
    >
      <div
        className={cn(
          'bg-popover text-popover-foreground relative w-full max-w-4xl rounded-2xl border shadow-2xl transition-transform',
          'duration-200 ease-out',
          open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
        )}
      >
        <header className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide uppercase">
              <span>Operation Plan</span>
              <Badge variant="outline" className="border-dashed text-xs">
                v{plan.version}
              </Badge>
              <Badge variant="outline" className="border-dashed text-xs">
                {plan.id}
              </Badge>
            </div>
            <div className="space-y-2">
              <h2
                id="operation-plan-title"
                className="text-xl font-semibold sm:text-2xl"
              >
                {describeOperation(plan)}
              </h2>
              <p className="text-muted-foreground text-sm leading-6">
                {plan.intent}
              </p>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span>
                Target:{' '}
                <Link
                  href={plan.resource.href}
                  className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                >
                  {plan.resource.kind} · {plan.resource.namespace}/
                  {plan.resource.name}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>Requested by {plan.audit.requestedBy}</span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>{createdAt}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RiskBadge tier={plan.risk.level} />
            <button
              type="button"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto px-6 py-6 sm:py-7">
          <section className="space-y-3">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Risk assessment
            </h3>
            <div className="space-y-2 text-sm leading-6">
              <p className="text-foreground/90">{plan.risk.rationale}</p>
              <dl className="grid gap-3 text-xs sm:grid-cols-3">
                <div className="space-y-1">
                  <dt className="text-muted-foreground tracking-wide uppercase">
                    Risk score
                  </dt>
                  <dd>
                    {plan.risk.score !== null
                      ? plan.risk.score.toFixed(2)
                      : '—'}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground tracking-wide uppercase">
                    SLO budget impact
                  </dt>
                  <dd className="capitalize">
                    {plan.risk.sloBudgetImpact ?? 'unknown'}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground tracking-wide uppercase">
                    Factors
                  </dt>
                  <dd>
                    {plan.risk.factors.length > 0
                      ? plan.risk.factors.join(', ')
                      : '—'}
                  </dd>
                </div>
              </dl>
              {plan.risk.postConditions.length > 0 ? (
                <div className="text-muted-foreground text-xs">
                  Post-conditions to verify:
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {plan.risk.postConditions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Proposed diff
              </h3>
              <span className="text-muted-foreground text-xs">
                {structuredChanges.length} change(s) · {plan.diff.patchFormat}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border">
              {structuredChanges.length === 0 ? (
                <div className="text-muted-foreground p-4 text-sm">
                  No patch operations in this plan.
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
                        <pre className="bg-background max-h-40 overflow-auto rounded-lg border p-3 text-xs">
                          {change.value}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <details className="rounded-xl border">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
                Deep diff · YAML snapshots
              </summary>
              <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-muted-foreground text-xs tracking-wide uppercase">
                    Before snapshot
                  </h4>
                  <pre className="bg-background max-h-72 overflow-auto rounded-lg border p-3 text-xs">
                    {plan.diff.before
                      ? JSON.stringify(plan.diff.before, null, 2)
                      : 'N/A'}
                  </pre>
                </div>
                <div className="space-y-2">
                  <h4 className="text-muted-foreground text-xs tracking-wide uppercase">
                    After snapshot
                  </h4>
                  <pre className="bg-background max-h-72 overflow-auto rounded-lg border p-3 text-xs">
                    {afterState
                      ? JSON.stringify(afterState, null, 2)
                      : 'Failed to render diff'}
                  </pre>
                </div>
              </div>
            </details>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Execution steps
              </h3>
              <span className="text-muted-foreground text-xs">
                {plan.steps.length} step(s)
              </span>
            </div>
            <ol className="space-y-3">
              {plan.steps.map((step) => (
                <li key={step.id} className="bg-muted/30 rounded-xl border p-4">
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
                    <pre className="bg-background mt-3 max-h-40 overflow-auto rounded-lg border p-3 text-xs">
                      {JSON.stringify(step.patch, null, 2)}
                    </pre>
                  ) : null}
                  {step.rollbackPatch && step.rollbackPatch.length > 0 ? (
                    <div className="mt-3 space-y-2 text-xs">
                      <p className="text-muted-foreground font-medium tracking-wide uppercase">
                        Rollback patch
                      </p>
                      <pre className="bg-background max-h-40 overflow-auto rounded-lg border p-3">
                        {JSON.stringify(step.rollbackPatch, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Audit trail
              </h3>
              <span className="text-muted-foreground text-xs">
                Requested by {plan.audit.requestedBy}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  Confirmation
                </span>
                <span>
                  {plan.audit.confirmedBy
                    ? `${plan.audit.confirmedBy} · ${confirmedAt}`
                    : 'Awaiting human approval'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  Execution
                </span>
                <span>
                  {executedAt
                    ? `${plan.audit.executedBy} · ${executedAt}`
                    : 'Not yet executed'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  Prompt source
                </span>
                <span>{plan.audit.sourcePromptId ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  Idempotency key
                </span>
                <span className="font-mono text-xs">
                  {plan.audit.idempotencyKey ?? '—'}
                </span>
              </div>
            </div>
          </section>
        </div>

        <footer className="bg-muted/40 flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground text-xs leading-relaxed">
            Pre-execution checks will revalidate the resource snapshot. If the
            live state drifts from
            <span className="font-medium"> diff.before</span>, execution will
            abort.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {onReject ? (
              <Button
                variant="outline"
                onClick={async () => {
                  if (onReject) {
                    await onReject(plan)
                  }
                  handleClose()
                }}
                className="sm:min-w-[140px]"
              >
                Reject
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleClose}
                className="sm:min-w-[140px]"
              >
                Cancel
              </Button>
            )}
            <Button
              ref={confirmButtonRef}
              className="sm:min-w-[180px]"
              disabled={isLoading}
              onClick={async () => {
                if (onApprove) {
                  await onApprove(plan)
                }
                handleClose()
              }}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="mr-2 h-4 w-4" aria-hidden />
              )}
              Approve & queue execution
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
