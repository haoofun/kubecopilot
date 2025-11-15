'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Badge } from '@ui-kit/badge'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildNodeRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { NodeInfoCard } from '@/components/k8s/nodes/NodeInfoCard'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { NodeDetail } from '@domain-k8s/types/node'
import type { PodSummary } from '@domain-k8s/types/pod'

interface NodeInspectorProps {
  detail?: DetailResponse<NodeDetail>
  isLoading?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function NodeInspector({
  detail,
  isLoading,
  collapsed,
  onCollapsedChange,
}: NodeInspectorProps) {
  const summary = detail?.summary
  const nodePodsQuery = useK8sResourceList<PodSummary>({
    resourceBase: 'pods',
    params: summary?.name
      ? {
          fieldSelector: `spec.nodeName=${summary.name}`,
          limit: 100,
        }
      : undefined,
    enabled: Boolean(summary?.name),
  })

  const relations = useMemo(
    () => buildNodeRelations(summary, nodePodsQuery.data?.items),
    [summary, nodePodsQuery.data?.items],
  )

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <NodeSummarySection summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: (
            <ResourceRelations
              relations={relations}
              emptyMessage={
                nodePodsQuery.isLoading
                  ? 'Loading related resources…'
                  : 'No related resources'
              }
            />
          ),
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <NodeStatusSection summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Referenced Manifests</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Nodes are cluster-scoped infrastructure objects without manifest
                references.
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="nodes"
              name={summary.name}
              uid={summary.uid}
              kind="Node"
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
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    />
  )
}

function NodeSummarySection({ summary }: { summary: NodeDetail }) {
  return <NodeInfoCard summary={summary} />
}

function NodeStatusSection({ summary }: { summary: NodeDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Scheduling &amp; Runtime</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <Info label="Kubelet Version" value={summary.kubeletVersion ?? '—'} />
          <Info
            label="Container Runtime"
            value={summary.containerRuntimeVersion ?? '—'}
          />
          <Info label="Pod CIDR" value={summary.podCIDR ?? '—'} />
          <Info
            label="Pod CIDRs"
            value={summary.podCIDRs.length ? summary.podCIDRs.join(', ') : '—'}
          />
          <Info label="Provider ID" value={summary.providerID ?? '—'} />
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Taints</p>
          {summary.taints.length === 0 ? (
            <p className="text-muted-foreground text-sm">None</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.taints.map((taint, index) => (
                <Badge
                  key={`${taint.key ?? 'taint'}-${index}`}
                  variant="outline"
                >
                  {taint.key ?? '*'}={taint.value ?? '*'} · {taint.effect}
                </Badge>
              ))}
            </div>
          )}
        </div>
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
