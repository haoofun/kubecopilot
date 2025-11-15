'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { SecretDetail } from '@domain-k8s/types/secret'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface SecretInfoCardProps {
  summary: SecretDetail
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

const renderSecretKeys = (summary: SecretDetail) => {
  const keys = Object.keys(summary.data)
  if (keys.length === 0) {
    return '—'
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        Secret values stay redacted. Keys remain available for audits and
        debugging.
      </p>
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => (
          <span
            key={key}
            className="border-muted-foreground/30 bg-muted/10 text-muted-foreground inline-flex rounded border px-2 py-1 font-mono text-xs leading-tight"
          >
            {key}
          </span>
        ))}
      </div>
    </div>
  )
}

export function SecretInfoCard({ summary }: SecretInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>Secret Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow label="Type" value={summary.type} />
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
        <InfoRow label="Keys" value={renderSecretKeys(summary)} />
      </CardContent>
    </Card>
  )
}
