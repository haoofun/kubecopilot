'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildNamespaceRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { NamespaceInfoCard } from '@/components/k8s/namespaces/NamespaceInfoCard'
import { NamespaceInsights } from '@/components/k8s/namespaces/NamespaceInsights'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { NamespaceDetail } from '@domain-k8s/types/namespace'

interface NamespaceInspectorProps {
  detail?: DetailResponse<NamespaceDetail>
  isLoading?: boolean
}

export function NamespaceInspector({
  detail,
  isLoading,
}: NamespaceInspectorProps) {
  const summary = detail?.summary
  const relations = buildNamespaceRelations(summary)

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <NamespaceInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={relations} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <NamespaceStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <NamespaceInsights summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="namespaces"
              name={summary.name}
              uid={summary.uid}
              kind="Namespace"
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

function NamespaceStatusCard({ summary }: { summary: NamespaceDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Namespace Status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Phase" value={summary.status} />
        <Info label="Labels" value={Object.keys(summary.labels).length} />
      </CardContent>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p>{value}</p>
    </div>
  )
}
