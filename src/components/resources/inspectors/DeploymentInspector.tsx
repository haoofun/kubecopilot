'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Badge } from '@ui-kit/badge'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildDeploymentRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { DeploymentInfoCard } from '@/components/k8s/deployments/DeploymentInfoCard'
import { DeploymentPodsCard } from '@/components/k8s/deployments/DeploymentPodsCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { DeploymentDetail } from '@domain-k8s/types/deployment'
import type { PodContainer } from '@domain-k8s/types/pod'

interface DeploymentInspectorProps {
  detail?: DetailResponse<DeploymentDetail>
  isLoading?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function DeploymentInspector({
  detail,
  isLoading,
  collapsed,
  onCollapsedChange,
}: DeploymentInspectorProps) {
  const summary = detail?.summary
  const relations = useMemo(
    () => buildDeploymentRelations(summary, detail?.raw),
    [summary, detail?.raw],
  )

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <DeploymentSummarySection summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={relations} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <DeploymentStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <DeploymentReferenceSection summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="deployments"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="Deployment"
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

function DeploymentSummarySection({ summary }: { summary: DeploymentDetail }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DeploymentInfoCard summary={summary} />
      <DeploymentSpecCard summary={summary} />
    </div>
  )
}

function DeploymentSpecCard({ summary }: { summary: DeploymentDetail }) {
  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Spec</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info
          label="Min Ready Seconds"
          value={summary.minReadySeconds ?? '—'}
        />
        <Info
          label="Progress Deadline"
          value={`${summary.progressDeadlineSeconds ?? '—'}s`}
        />
        <Info
          label="Revision History"
          value={summary.revisionHistoryLimit ?? '—'}
        />
        <Info label="Paused" value={summary.paused ? 'Yes' : 'No'} />
        <InfoBlock label="Template Labels">
          <KeyValueChips data={summary.templateLabels} />
        </InfoBlock>
        <InfoBlock label="Template Annotations">
          <KeyValueChips data={summary.templateAnnotations} />
        </InfoBlock>
      </CardContent>
    </Card>
  )
}

function DeploymentStatusCard({ summary }: { summary: DeploymentDetail }) {
  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <Info
            label="Ready"
            value={`${summary.readyReplicas} / ${summary.desiredReplicas}`}
          />
          <Info label="Updated" value={summary.updatedReplicas} />
          <Info label="Available" value={summary.availableReplicas} />
        </div>
        <InfoBlock label="Conditions">
          {summary.conditions.length === 0 ? (
            <p className="text-muted-foreground text-sm">None</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {summary.conditions.map((condition) => (
                <li key={condition.type} className="rounded border px-2 py-1">
                  <div className="font-semibold">{condition.type}</div>
                  <div className="text-muted-foreground">
                    {condition.status}
                    {condition.reason ? ` · ${condition.reason}` : ''}
                  </div>
                  {condition.message ? (
                    <p className="text-muted-foreground/80">
                      {condition.message}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </InfoBlock>
      </CardContent>
    </Card>
  )
}

function DeploymentReferenceSection({
  summary,
}: {
  summary: DeploymentDetail
}) {
  return (
    <div className="space-y-4">
      <DeploymentTemplateCard containers={summary.containers} />
      <DeploymentPodsCard summary={summary} />
    </div>
  )
}

function DeploymentTemplateCard({
  containers,
}: {
  containers: PodContainer[]
}) {
  if (!containers.length) return null
  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Pod Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {containers.map((container) => (
          <div key={container.name} className="rounded border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{container.name}</p>
                <p className="text-muted-foreground text-xs">
                  {container.image}
                </p>
              </div>
              <Badge variant="outline">Template</Badge>
            </div>
            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Requests</p>
                <p>
                  CPU {container.resources.requests.cpu ?? '—'} · Memory{' '}
                  {container.resources.requests.memory ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Limits</p>
                <p>
                  CPU {container.resources.limits.cpu ?? '—'} · Memory{' '}
                  {container.resources.limits.memory ?? '—'}
                </p>
              </div>
            </div>
          </div>
        ))}
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

function InfoBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="sm:col-span-2">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {children}
    </div>
  )
}

function KeyValueChips({ data }: { data: Record<string, string> }) {
  const entries = Object.entries(data)
  if (!entries.length) {
    return <p className="text-muted-foreground text-sm">None</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="secondary">
          {key}={value}
        </Badge>
      ))}
    </div>
  )
}
