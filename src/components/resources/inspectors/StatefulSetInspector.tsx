'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Badge } from '@ui-kit/badge'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import {
  buildStatefulSetRelations,
  formatLabelSelector,
} from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { StatefulSetInfoCard } from '@/components/k8s/statefulsets/StatefulSetInfoCard'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { PodSummary } from '@domain-k8s/types/pod'
import type { StatefulSetDetail } from '@domain-k8s/types/statefulset'

interface StatefulSetInspectorProps {
  detail?: DetailResponse<StatefulSetDetail>
  isLoading?: boolean
}

export function StatefulSetInspector({
  detail,
  isLoading,
}: StatefulSetInspectorProps) {
  const summary = detail?.summary
  const selector = formatLabelSelector(summary?.selector)

  const podsQuery = useK8sResourceList<PodSummary>({
    resourceBase: 'pods',
    namespace: summary?.namespace,
    params: selector
      ? {
          labelSelector: selector,
          limit: 50,
        }
      : undefined,
    enabled: Boolean(summary?.namespace && selector),
  })

  const relations = useMemo(
    () => buildStatefulSetRelations(summary, podsQuery.data?.items),
    [summary, podsQuery.data?.items],
  )

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <StatefulSetInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: (
            <ResourceRelations
              relations={relations}
              emptyMessage={
                podsQuery.isLoading
                  ? 'Loading related resources…'
                  : 'No related resources'
              }
            />
          ),
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <StatefulSetStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <StatefulSetReferenceCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="statefulsets"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="StatefulSet"
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

function StatefulSetStatusCard({ summary }: { summary: StatefulSetDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <Info label="Desired" value={summary.desiredReplicas} />
          <Info label="Ready" value={summary.readyReplicas} />
          <Info label="Current" value={summary.currentReplicas} />
          <Info label="Updated" value={summary.updatedReplicas} />
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Conditions</p>
          {summary.conditions.length === 0 ? (
            <p className="text-muted-foreground text-sm">None</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.conditions.map((condition) => (
                <Badge key={condition.type} variant="outline">
                  {condition.type}: {condition.status}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatefulSetReferenceCard({ summary }: { summary: StatefulSetDetail }) {
  const hasClaims = summary.volumeClaims.length > 0
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Selectors &amp; Volume Claims</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Pod Selector</p>
          <p>
            {summary.selector && Object.keys(summary.selector).length > 0
              ? Object.entries(summary.selector)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(', ')
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Update Strategy</p>
          <p>
            {summary.strategy.rollingUpdate?.partition !== undefined
              ? `${summary.strategy.type} · partition ${summary.strategy.rollingUpdate.partition}`
              : summary.strategy.type}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">
            Volume Claim Templates
          </p>
          {hasClaims ? (
            <div className="flex flex-wrap gap-2">
              {summary.volumeClaims.map((claim) => (
                <Badge key={claim.name} variant="secondary">
                  {claim.name}
                  {claim.storageClass ? ` · ${claim.storageClass}` : ''}
                  {claim.storage ? ` · ${claim.storage}` : ''}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">None</p>
          )}
        </div>
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
