'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildServiceRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { ServiceInfoCard } from '@/components/k8s/services/ServiceInfoCard'
import { ServiceEndpointsCard } from '@/components/k8s/services/ServiceEndpointsCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { ServiceDetail } from '@domain-k8s/types/service'

interface ServiceInspectorProps {
  detail?: DetailResponse<ServiceDetail>
  isLoading?: boolean
}

export function ServiceInspector({ detail, isLoading }: ServiceInspectorProps) {
  const summary = detail?.summary
  const relations = buildServiceRelations(summary)

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <ServiceInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={relations} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <ServiceStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <ServiceEndpointsCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="services"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="Service"
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

function ServiceStatusCard({ summary }: { summary: ServiceDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Network Status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">Type</p>
          <p>{summary.type}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Cluster IP</p>
          <p>{summary.clusterIP || '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">External IPs</p>
          <p>
            {summary.externalIPs.length
              ? summary.externalIPs.join(', ')
              : 'None'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Ports</p>
          <p>{summary.ports.length ? summary.ports.join(', ') : '—'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
