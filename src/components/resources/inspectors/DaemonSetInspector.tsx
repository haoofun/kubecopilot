'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Badge } from '@ui-kit/badge'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import {
  buildDaemonSetRelations,
  formatLabelSelector,
} from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { DaemonSetInfoCard } from '@/components/k8s/daemonsets/DaemonSetInfoCard'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { DaemonSetDetail } from '@domain-k8s/types/daemonset'
import type { PodSummary } from '@domain-k8s/types/pod'

interface DaemonSetInspectorProps {
  detail?: DetailResponse<DaemonSetDetail>
  isLoading?: boolean
}

export function DaemonSetInspector({
  detail,
  isLoading,
}: DaemonSetInspectorProps) {
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
    () => buildDaemonSetRelations(summary, podsQuery.data?.items),
    [summary, podsQuery.data?.items],
  )

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <DaemonSetInfoCard summary={summary} />,
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
          content: <DaemonSetStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <DaemonSetReferenceCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="daemonsets"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="DaemonSet"
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

function DaemonSetStatusCard({ summary }: { summary: DaemonSetDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <Info label="Desired Pods" value={summary.desiredPods} />
          <Info label="Ready Pods" value={summary.readyPods} />
          <Info label="Current Pods" value={summary.currentPods} />
          <Info label="Updated Pods" value={summary.updatedPods} />
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

function DaemonSetReferenceCard({ summary }: { summary: DaemonSetDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Selectors &amp; Scheduling</CardTitle>
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
            {summary.strategy.rollingUpdate?.maxUnavailable !== undefined
              ? `${summary.strategy.type} · maxUnavailable ${summary.strategy.rollingUpdate.maxUnavailable}`
              : summary.strategy.type}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Node Selector</p>
          <p>
            {Object.keys(summary.nodeSelector ?? {}).length > 0
              ? Object.entries(summary.nodeSelector)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(', ')
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Tolerations</p>
          {summary.tolerations.length === 0 ? (
            <p className="text-muted-foreground text-sm">None</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.tolerations.map((toleration, index) => (
                <Badge
                  key={`${toleration.key ?? 'tol'}-${index}`}
                  variant="secondary"
                >
                  {toleration.key ?? '*'} {toleration.operator ?? '='}{' '}
                  {toleration.value ?? '*'} · {toleration.effect ?? 'None'}
                </Badge>
              ))}
            </div>
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
