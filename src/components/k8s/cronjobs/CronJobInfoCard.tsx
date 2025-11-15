'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { CronJobDetail } from '@domain-k8s/types/cronjob'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface CronJobInfoCardProps {
  summary: CronJobDetail
}

const renderKeyValueChips = (data?: Record<string, string>) => {
  if (!data || Object.keys(data).length === 0) {
    return '—'
  }

  return (
    <div className="flex w-full flex-wrap gap-2">
      {Object.entries(data).map(([key, value]) => (
        <span
          key={key}
          className="bg-muted/50 text-muted-foreground inline-flex max-w-full min-w-0 rounded border px-2 py-1 font-mono text-xs leading-tight break-words break-all"
        >
          {key}={value}
        </span>
      ))}
    </div>
  )
}

const renderConditions = (summary: CronJobDetail) => {
  if (!summary.conditions || summary.conditions.length === 0) {
    return '—'
  }

  return (
    <div className="text-muted-foreground space-y-1 text-xs">
      {summary.conditions.map((condition, index) => (
        <div key={`${condition.type}-${index}`}>
          <span className="text-foreground font-medium">{condition.type}</span>
          <span className="mx-1">·</span>
          {condition.status}
          {condition.reason ? ` — ${condition.reason}` : ''}
        </div>
      ))}
    </div>
  )
}

export function CronJobInfoCard({ summary }: CronJobInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )
  const { display: lastSchedule, iso: lastScheduleIso } = useStableTimestamp(
    summary.lastScheduleTime,
    '—',
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>CronJob Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow label="Schedule" value={summary.schedule} />
        <InfoRow label="Suspend" value={summary.suspend ? 'Yes' : 'No'} />
        <InfoRow label="Active Jobs" value={summary.active} />
        <InfoRow
          label="Last Schedule"
          value={lastSchedule}
          helper={lastScheduleIso}
        />
        <InfoRow
          label="Creation Timestamp"
          value={creationTime}
          helper={creationIso}
        />
        <InfoRow label="Concurrency Policy" value={summary.concurrencyPolicy} />
        <InfoRow
          label="Starting Deadline"
          value={
            summary.startingDeadlineSeconds
              ? `${summary.startingDeadlineSeconds}s`
              : 'None'
          }
        />
        <InfoRow
          label="History Limits"
          value={`Success ${summary.successfulJobsHistoryLimit ?? 'Default'} · Fail ${summary.failedJobsHistoryLimit ?? 'Default'}`}
        />
        <InfoRow
          label="Selector"
          value={
            summary.selector
              ? Object.entries(summary.selector)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(', ')
              : '—'
          }
        />
        <InfoRow label="Labels" value={renderKeyValueChips(summary.labels)} />
        <InfoRow
          label="Annotations"
          value={renderKeyValueChips(summary.annotations)}
        />
        <InfoRow label="Conditions" value={renderConditions(summary)} />
      </CardContent>
    </Card>
  )
}
