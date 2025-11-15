'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildPVCRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { PVCInfoCard } from '@/components/k8s/pvcs/PVCInfoCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { PVCDetail } from '@domain-k8s/types/pvc'

interface PVCInspectorProps {
  detail?: DetailResponse<PVCDetail>
  isLoading?: boolean
}

export function PVCInspector({ detail, isLoading }: PVCInspectorProps) {
  const summary = detail?.summary
  const relations = buildPVCRelations(summary)

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <PVCInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={relations} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <PVCStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <PVCReferenceCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="pvcs"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="PersistentVolumeClaim"
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

function PVCStatusCard({ summary }: { summary: PVCDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Storage Status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Phase" value={summary.phase ?? '—'} />
        <Info label="Storage Class" value={summary.storageClass ?? '—'} />
        <Info label="Requested" value={summary.storage ?? '—'} />
        <Info label="Bound Capacity" value={summary.capacity ?? '—'} />
      </CardContent>
    </Card>
  )
}

function PVCReferenceCard({ summary }: { summary: PVCDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Volume Binding</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="text-muted-foreground text-xs">Volume Name</p>
        <p>{summary.volumeName ?? 'Not bound'}</p>
        <p className="text-muted-foreground mt-3 text-xs">Access Modes</p>
        <p>
          {summary.accessModes?.length ? summary.accessModes.join(', ') : '—'}
        </p>
      </CardContent>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p>{value}</p>
    </div>
  )
}
