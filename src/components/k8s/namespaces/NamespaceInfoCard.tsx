'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { NamespaceDetail } from '@/lib/k8s/types/namespace'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface NamespaceInfoCardProps {
  summary: NamespaceDetail
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

export function NamespaceInfoCard({ summary }: NamespaceInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>Namespace Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Status" value={summary.status} />
        <InfoRow
          label="Creation Timestamp"
          value={creationTime}
          helper={creationIso}
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
