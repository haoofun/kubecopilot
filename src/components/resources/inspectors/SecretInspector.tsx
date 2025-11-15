'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { SecretInfoCard } from '@/components/k8s/secrets/SecretInfoCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { SecretDetail } from '@domain-k8s/types/secret'

interface SecretInspectorProps {
  detail?: DetailResponse<SecretDetail>
  isLoading?: boolean
}

export function SecretInspector({ detail, isLoading }: SecretInspectorProps) {
  const summary = detail?.summary
  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <SecretInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={[]} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <SecretStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <SecretKeysCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="secrets"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="Secret"
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

function SecretStatusCard({ summary }: { summary: SecretDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Secret Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Type" value={summary.type} />
        <Info label="Key Count" value={summary.dataCount} />
      </CardContent>
    </Card>
  )
}

function SecretKeysCard({ summary }: { summary: SecretDetail }) {
  const keys = Object.keys(summary.data)
  if (!keys.length) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Keys</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No keys stored.
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Keys</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="text-muted-foreground text-xs">
          Values redacted. Copy keys below for troubleshooting.
        </p>
        <p>{keys.join(', ')}</p>
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
