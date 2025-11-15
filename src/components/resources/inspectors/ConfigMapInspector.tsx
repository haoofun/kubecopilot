'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { ConfigMapInfoCard } from '@/components/k8s/configmaps/ConfigMapInfoCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { ConfigMapDetail } from '@domain-k8s/types/configmap'

interface ConfigMapInspectorProps {
  detail?: DetailResponse<ConfigMapDetail>
  isLoading?: boolean
}

export function ConfigMapInspector({
  detail,
  isLoading,
}: ConfigMapInspectorProps) {
  const summary = detail?.summary
  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <ConfigMapInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={[]} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <ConfigMapStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <ConfigMapKeysCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="configmaps"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="ConfigMap"
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

function ConfigMapStatusCard({ summary }: { summary: ConfigMapDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Data Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Text Keys" value={Object.keys(summary.data).length} />
        <Info
          label="Binary Keys"
          value={Object.keys(summary.binaryData).length}
        />
      </CardContent>
    </Card>
  )
}

function ConfigMapKeysCard({ summary }: { summary: ConfigMapDetail }) {
  const keys = Object.keys(summary.data)
  const binaryKeys = Object.keys(summary.binaryData)
  if (!keys.length && !binaryKeys.length) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Keys</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No data keys stored.
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Keys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {keys.length ? (
          <div>
            <p className="text-muted-foreground text-xs">Data</p>
            <p>{keys.join(', ')}</p>
          </div>
        ) : null}
        {binaryKeys.length ? (
          <div>
            <p className="text-muted-foreground text-xs">Binary Data</p>
            <p>{binaryKeys.join(', ')}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p>{value}</p>
    </div>
  )
}
