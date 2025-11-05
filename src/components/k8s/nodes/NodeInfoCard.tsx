'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { NodeDetail } from '@/lib/k8s/types/node'
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

const renderKeyValueMap = (data: Record<string, string>) => {
  if (Object.keys(data).length === 0) return '—'
  return (
    <div className="text-muted-foreground space-y-1 text-xs">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <span className="text-foreground font-medium">{key}</span>
          <span className="mx-1">·</span>
          {value}
        </div>
      ))}
    </div>
  )
}

const renderConditions = (summary: NodeDetail) => {
  const conditions = summary.statusDetail.conditions
  if (!conditions || conditions.length === 0) return '—'

  return (
    <div className="text-muted-foreground space-y-1 text-xs">
      {conditions.map((condition, index) => (
        <div key={`${condition.type}-${index}`}>
          <span className="text-foreground font-medium">{condition.type}</span>
          <span className="mx-1">·</span>
          {condition.status}
          {condition.reason ? ` (${condition.reason})` : ''}
        </div>
      ))}
    </div>
  )
}

const renderAddresses = (summary: NodeDetail) => {
  const addresses = summary.statusDetail.addresses ?? []
  if (addresses.length === 0) return '—'

  return (
    <div className="text-muted-foreground space-y-1 text-xs">
      {addresses.map((address, index) => (
        <div key={`${address.type}-${index}`}>
          <span className="text-foreground font-medium">{address.type}</span>
          <span className="mx-1">·</span>
          {address.address}
        </div>
      ))}
    </div>
  )
}

export function NodeInfoCard({ summary }: { summary: NodeDetail }) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>Node Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Roles" value={summary.roles.join(', ')} />
        <InfoRow label="Status" value={summary.status} />
        <InfoRow label="OS Image" value={summary.osImage ?? '—'} />
        <InfoRow
          label="Creation Timestamp"
          value={creationTime}
          helper={creationIso}
        />
        <InfoRow
          label="Capacity"
          value={renderKeyValueMap(summary.statusDetail.capacity)}
        />
        <InfoRow
          label="Allocatable"
          value={renderKeyValueMap(summary.statusDetail.allocatable)}
        />
        <InfoRow label="Addresses" value={renderAddresses(summary)} />
        <InfoRow label="Conditions" value={renderConditions(summary)} />
        <InfoRow label="Labels" value={renderKeyValueChips(summary.labels)} />
        <InfoRow
          label="Annotations"
          value={renderKeyValueChips(summary.annotations)}
        />
      </CardContent>
    </Card>
  )
}
