'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { DeploymentDetail } from '@/lib/k8s/types/deployment'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface DeploymentInfoCardProps {
  summary: DeploymentDetail
}

const formatKeyValueChips = (data?: Record<string, string>) => {
  if (!data || Object.keys(data).length === 0) {
    return '—'
  }

  return (
    <div className="flex w-full flex-wrap gap-2">
      {Object.entries(data).map(([key, value]) => (
        <span
          key={key}
          className="bg-muted/50 text-muted-foreground inline-flex max-w-full min-w-0 overflow-hidden rounded border px-2 py-1 font-mono text-xs leading-tight break-words break-all"
        >
          {key}={value}
        </span>
      ))}
    </div>
  )
}

const renderStrategy = (summary: DeploymentDetail) => {
  const { type, rollingUpdate } = summary.strategy
  if (type !== 'RollingUpdate' || !rollingUpdate) {
    return type || 'Unknown'
  }

  return (
    <div className="space-y-1">
      <div>{type}</div>
      <div className="text-muted-foreground font-mono text-xs">
        maxUnavailable: {rollingUpdate.maxUnavailable ?? '—'} · maxSurge:{' '}
        {rollingUpdate.maxSurge ?? '—'}
      </div>
    </div>
  )
}

export function DeploymentInfoCard({ summary }: DeploymentInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>Deployment Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow
          label="Ready"
          value={`${summary.readyReplicas}/${summary.desiredReplicas}`}
        />
        <InfoRow label="Updated" value={summary.updatedReplicas} />
        <InfoRow label="Available" value={summary.availableReplicas} />
        <InfoRow
          label="Creation Timestamp"
          value={creationTime}
          helper={creationIso}
        />
        <InfoRow label="Labels" value={formatKeyValueChips(summary.labels)} />
        <InfoRow
          label="Annotations"
          value={formatKeyValueChips(summary.annotations)}
        />
        <InfoRow label="Rollout Strategy" value={renderStrategy(summary)} />
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
      </CardContent>
    </Card>
  )
}
