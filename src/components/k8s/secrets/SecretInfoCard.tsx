'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { SecretDetail } from '@/lib/k8s/types/secret'
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

const renderSecretData = (summary: SecretDetail, reveal: boolean) => {
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
            {reveal ? value || '(empty)' : '••••••••'}
          </pre>
        </div>
      ))}
    </div>
  )
}

export function SecretInfoCard({ summary }: SecretInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )
  const [reveal, setReveal] = useState(false)

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Secret Information</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReveal((prev) => !prev)}
          >
            {reveal ? '隐藏值' : '显示值'}
          </Button>
        </div>
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
        <InfoRow label="Data" value={renderSecretData(summary, reveal)} />
      </CardContent>
    </Card>
  )
}
