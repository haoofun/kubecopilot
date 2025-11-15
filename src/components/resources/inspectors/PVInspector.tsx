'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildPVRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { PVInfoCard } from '@/components/k8s/pvs/PVInfoCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { PVDetail } from '@domain-k8s/types/pv'

interface PVInspectorProps {
  detail?: DetailResponse<PVDetail>
  isLoading?: boolean
}

export function PVInspector({ detail, isLoading }: PVInspectorProps) {
  const summary = detail?.summary
  const relations = buildPVRelations(summary)

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <PVInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={relations} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <PVStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <PVReferenceCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="pvs"
              name={summary.name}
              uid={summary.uid}
              kind="PersistentVolume"
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

function PVStatusCard({ summary }: { summary: PVDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Storage Status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Phase" value={summary.status ?? '—'} />
        <Info label="Storage Class" value={summary.storageClass ?? '—'} />
        <Info label="Capacity" value={summary.capacity ?? '—'} />
        <Info label="Reclaim Policy" value={summary.reclaimPolicy ?? '—'} />
      </CardContent>
    </Card>
  )
}

function PVReferenceCard({ summary }: { summary: PVDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Claim Reference</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="text-muted-foreground text-xs">Bound Claim</p>
        <p>
          {summary.claimRef?.name
            ? `${summary.claimRef.namespace ?? 'cluster'}/${summary.claimRef.name}`
            : 'Not bound'}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">Volume Mode</p>
        <p>{summary.volumeMode ?? 'Filesystem'}</p>
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
