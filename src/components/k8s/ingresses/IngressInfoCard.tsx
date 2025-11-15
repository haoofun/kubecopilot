'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { InfoRow } from '@/components/shared/InfoRow'
import type { IngressDetail } from '@domain-k8s/types/ingress'
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

const renderRules = (summary: IngressDetail) => {
  if (!summary.rules || summary.rules.length === 0) {
    return '—'
  }

  return (
    <div className="space-y-2">
      {summary.rules.map((rule, index) => (
        <div
          key={`${rule.host ?? 'default'}-${index}`}
          className="border-muted-foreground/20 bg-muted/10 rounded border p-2 text-xs"
        >
          <div className="text-foreground font-semibold">
            {rule.host ?? '*'}
          </div>
          <ul className="text-muted-foreground mt-1 list-disc space-y-1 pl-4">
            {rule.paths.map((path, idx) => (
              <li key={`${path.path ?? 'root'}-${idx}`}>
                {path.path ?? '/'} ({path.pathType ?? 'ImplementationSpecific'})
                →<span className="ml-1 font-mono">{path.backend}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

const renderTLS = (summary: IngressDetail) => {
  if (!summary.tls || summary.tls.length === 0) {
    return '—'
  }

  return (
    <div className="text-muted-foreground space-y-1 text-xs">
      {summary.tls.map((entry, index) => (
        <div key={`${entry.secretName ?? 'tls'}-${index}`}>
          Secret: {entry.secretName ?? '—'} · Hosts:{' '}
          {entry.hosts.length > 0 ? entry.hosts.join(', ') : '—'}
        </div>
      ))}
    </div>
  )
}

export function IngressInfoCard({ summary }: { summary: IngressDetail }) {
  const { display: creationTime, iso: creationIso } = useStableTimestamp(
    summary.creationTimestamp,
  )

  return (
    <Card className="w-full max-w-full shadow-sm">
      <CardHeader>
        <CardTitle>Ingress Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InfoRow label="Name" value={summary.name} />
        <InfoRow label="Namespace" value={summary.namespace} />
        <InfoRow
          label="Hosts"
          value={summary.hosts.length > 0 ? summary.hosts.join(', ') : '—'}
        />
        <InfoRow
          label="Default Backend"
          value={summary.defaultBackend ?? '—'}
        />
        <InfoRow label="TLS" value={renderTLS(summary)} />
        <InfoRow label="Rules" value={renderRules(summary)} />
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
