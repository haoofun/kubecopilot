'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { PVDetail } from '@/lib/k8s/types/pv'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

const renderKeyValueChips = (data?: Record<string, string>) => {
  if (!data || Object.keys(data).length === 0) return '—'

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

export function PVInfoCard({ summary }: { summary: PVDetail }) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>PersistentVolume</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Storage Class" value={summary.storageClass ?? '—'} />
        <InfoRow label="Capacity" value={summary.capacity ?? '—'} />
        <InfoRow
          label="Access Modes"
          value={summary.accessModes.join(', ') || '—'}
        />
        <InfoRow label="Reclaim Policy" value={summary.reclaimPolicy ?? '—'} />
        <InfoRow
          label="Volume Mode"
          value={summary.volumeMode ?? 'Filesystem'}
        />
        <InfoRow
          label="Bound Claim"
          value={
            summary.claimRef
              ? `${summary.claimRef.namespace}/${summary.claimRef.name}`
              : 'Unbound'
          }
        />
        <InfoRow label="Phase" value={summary.status ?? 'Unknown'} />
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
