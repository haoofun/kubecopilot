'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { PodDetail } from '@domain-k8s/types/pod'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface PodInfoCardProps {
  summary: PodDetail
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
          className="bg-muted/50 text-muted-foreground inline-flex max-w-full min-w-0 overflow-hidden rounded border px-2 py-1 font-mono text-xs leading-tight break-words break-all"
        >
          {key}={value}
        </span>
      ))}
    </div>
  )
}

export function PodInfoCard({ summary }: PodInfoCardProps) {
  const { display: createdDisplay, iso: createdIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>Pod Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow label="Status" value={summary.status} />
        <InfoRow label="Node" value={summary.nodeName ?? 'Unknown'} />
        <InfoRow label="Pod IP" value={summary.ip || '—'} />
        <InfoRow label="Restarts" value={summary.restarts} />
        <InfoRow
          label="Owner"
          value={
            summary.owner ? `${summary.owner.kind}/${summary.owner.name}` : '—'
          }
        />
        <InfoRow
          label="Creation Timestamp"
          value={createdDisplay}
          helper={createdIso}
        />
        <InfoRow label="Labels" value={renderKeyValueChips(summary.labels)} />
        <InfoRow
          label="Annotations"
          value={renderKeyValueChips(summary.annotations)}
        />
      </CardContent>
    </Card>
  )
}
