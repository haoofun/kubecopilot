'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { DaemonSetDetail } from '@/lib/k8s/types/daemonset'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface DaemonSetInfoCardProps {
  summary: DaemonSetDetail
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

const renderTolerations = (summary: DaemonSetDetail) => {
  if (!summary.tolerations || summary.tolerations.length === 0) {
    return '—'
  }

  return (
    <div className="text-muted-foreground flex flex-col gap-1 text-xs">
      {summary.tolerations.map((toleration, index) => (
        <div key={`${toleration.key ?? 'tol'}-${index}`}>
          {toleration.key ?? '*'} {toleration.operator ?? '='}{' '}
          {toleration.value ?? '*'} ({toleration.effect ?? 'None'})
        </div>
      ))}
    </div>
  )
}

export function DaemonSetInfoCard({ summary }: DaemonSetInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>DaemonSet Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow
          label="Pods"
          value={`${summary.readyPods}/${summary.desiredPods} Ready`}
        />
        <InfoRow label="Current" value={summary.currentPods} />
        <InfoRow label="Updated" value={summary.updatedPods} />
        <InfoRow
          label="Creation Timestamp"
          value={creationTime}
          helper={creationIso}
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
        <InfoRow
          label="Update Strategy"
          value={
            summary.strategy.rollingUpdate?.maxUnavailable !== undefined
              ? `${summary.strategy.type} · maxUnavailable ${summary.strategy.rollingUpdate.maxUnavailable}`
              : summary.strategy.type
          }
        />
        <InfoRow
          label="Node Selector"
          value={
            Object.keys(summary.nodeSelector ?? {}).length > 0
              ? renderKeyValueChips(summary.nodeSelector)
              : '—'
          }
        />
        <InfoRow label="Tolerations" value={renderTolerations(summary)} />
        <InfoRow label="Labels" value={renderKeyValueChips(summary.labels)} />
        <InfoRow
          label="Annotations"
          value={renderKeyValueChips(summary.annotations)}
        />
      </CardContent>
    </Card>
  )
}
