'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { StatefulSetDetail } from '@domain-k8s/types/statefulset'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface StatefulSetInfoCardProps {
  summary: StatefulSetDetail
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

const renderVolumeClaims = (summary: StatefulSetDetail) => {
  if (!summary.volumeClaims || summary.volumeClaims.length === 0) {
    return '—'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {summary.volumeClaims.map((claim) => (
        <span
          key={claim.name}
          className="text-muted-foreground rounded border border-dashed px-2 py-1 font-mono text-xs"
        >
          {claim.name}
          {claim.storageClass ? ` · ${claim.storageClass}` : ''}
          {claim.storage ? ` · ${claim.storage}` : ''}
        </span>
      ))}
    </div>
  )
}

export function StatefulSetInfoCard({ summary }: StatefulSetInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>StatefulSet Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow
          label="Replicas"
          value={`${summary.readyReplicas}/${summary.desiredReplicas} Ready`}
        />
        <InfoRow label="Current" value={summary.currentReplicas} />
        <InfoRow label="Updated" value={summary.updatedReplicas} />
        <InfoRow
          label="Creation Timestamp"
          value={creationTime}
          helper={creationIso}
        />
        <InfoRow label="Headless Service" value={summary.serviceName ?? '—'} />
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
        <InfoRow
          label="Update Strategy"
          value={
            summary.strategy.rollingUpdate?.partition !== undefined
              ? `${summary.strategy.type} · partition ${summary.strategy.rollingUpdate.partition}`
              : summary.strategy.type
          }
        />
        <InfoRow label="Pod Management" value={summary.podManagementPolicy} />
        <InfoRow label="Volume Claims" value={renderVolumeClaims(summary)} />
        <InfoRow label="Labels" value={renderKeyValueChips(summary.labels)} />
        <InfoRow
          label="Annotations"
          value={renderKeyValueChips(summary.annotations)}
        />
      </CardContent>
    </Card>
  )
}
