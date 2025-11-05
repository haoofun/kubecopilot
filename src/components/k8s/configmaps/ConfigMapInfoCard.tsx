'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { ConfigMapDetail } from '@/lib/k8s/types/configmap'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface ConfigMapInfoCardProps {
  summary: ConfigMapDetail
  onReveal?: (key: string) => void
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

const renderDataEntries = (summary: ConfigMapDetail) => {
  const entries = Object.entries(summary.data)
  if (entries.length === 0) {
    return '—'
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="border-muted-foreground/30 bg-muted/10 rounded border p-2"
        >
          <div className="text-foreground text-xs font-semibold">{key}</div>
          <pre className="text-muted-foreground mt-1 text-xs break-words whitespace-pre-wrap">
            {value || '(empty)'}
          </pre>
        </div>
      ))}
    </div>
  )
}

export function ConfigMapInfoCard({ summary }: ConfigMapInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>ConfigMap Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow label="Entries" value={Object.keys(summary.data).length} />
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
        <InfoRow label="Data" value={renderDataEntries(summary)} />
      </CardContent>
    </Card>
  )
}
