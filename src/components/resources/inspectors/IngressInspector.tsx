'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildIngressRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { IngressInfoCard } from '@/components/k8s/ingresses/IngressInfoCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { IngressDetail } from '@domain-k8s/types/ingress'

interface IngressInspectorProps {
  detail?: DetailResponse<IngressDetail>
  isLoading?: boolean
}

export function IngressInspector({ detail, isLoading }: IngressInspectorProps) {
  const summary = detail?.summary
  const relations = buildIngressRelations(summary)

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <IngressInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={relations} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <IngressStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <IngressReferenceCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="ingresses"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="Ingress"
            />
          ),
        },
        {
          id: 'yaml',
          label: 'YAML',
          content: (
            <ReadOnlyYamlViewer
              yaml={detail?.yaml}
              raw={detail?.raw}
              showCopyButton
            />
          ),
        },
      ]
    : []

  return (
    <ResourceInspector
      title={summary ? summary.name : 'Inspector'}
      sections={sections}
      isLoading={isLoading}
      hasSelection={Boolean(summary)}
    />
  )
}

function IngressStatusCard({ summary }: { summary: IngressDetail }) {
  const tlsHosts = summary.tls.flatMap((entry) => entry.hosts)
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Exposure Status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">Hosts</p>
          <p>{summary.hosts.length ? summary.hosts.join(', ') : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">TLS Coverage</p>
          <p>{tlsHosts.length ? `${tlsHosts.length} host(s)` : 'None'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Backend Services</p>
          <p>{summary.serviceCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Default Backend</p>
          <p>{summary.defaultBackend ?? '—'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function IngressReferenceCard({ summary }: { summary: IngressDetail }) {
  if (summary.rules.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Routing Rules</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No HTTP rules configured for this ingress.
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Routing Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {summary.rules.map((rule, index) => (
          <div
            key={`${rule.host ?? 'default'}-${index}`}
            className="rounded border p-3"
          >
            <p className="font-semibold">
              {rule.host ?? 'Default host'} ({rule.paths.length} path
              {rule.paths.length === 1 ? '' : 's'})
            </p>
            <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
              {rule.paths.map((path, idx) => (
                <li key={`${path.backend}-${idx}`}>
                  {path.path ?? '/'} · {path.pathType ?? 'Prefix'} →{' '}
                  {path.backend}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
