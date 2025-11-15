'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { ServiceDetail } from '@domain-k8s/types/service'
import { useStableTimestamp } from '@/hooks/useStableTimestamp'

interface ServiceInfoCardProps {
  summary: ServiceDetail
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

const renderSessionAffinity = (summary: ServiceDetail) => {
  if (summary.sessionAffinity !== 'ClientIP') {
    return summary.sessionAffinity
  }

  const timeoutSeconds = summary.sessionAffinityConfig?.clientIPTimeoutSeconds
  const timeoutLabel = timeoutSeconds
    ? `${timeoutSeconds}s`
    : 'default (10800s)'

  return (
    <div className="space-y-1">
      <div>ClientIP</div>
      <div className="text-muted-foreground text-xs">
        timeoutSeconds: {timeoutLabel}
      </div>
    </div>
  )
}

export function ServiceInfoCard({ summary }: ServiceInfoCardProps) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>Service Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow label="Type" value={summary.type} />
        <InfoRow label="Cluster IP" value={summary.clusterIP || '—'} />
        <InfoRow
          label="External IPs"
          value={summary.externalIPs.join(', ') || 'None'}
        />
        <InfoRow
          label="Session Affinity"
          value={renderSessionAffinity(summary)}
        />
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
        <InfoRow
          label="Ports"
          value={
            summary.fullPorts.length > 0
              ? summary.fullPorts.map((p, index) => (
                  <div
                    key={`${p.name ?? 'port'}-${p.port}-${p.targetPort ?? 'target'}-${index}`}
                    className="font-mono text-xs"
                  >
                    {p.name ? `${p.name} · ` : ''}
                    {p.port}:{p.targetPort ?? '-'} ({p.protocol}
                    {p.nodePort ? ` · NodePort ${p.nodePort}` : ''})
                  </div>
                ))
              : '—'
          }
        />
        <InfoRow
          label="Selectors"
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
