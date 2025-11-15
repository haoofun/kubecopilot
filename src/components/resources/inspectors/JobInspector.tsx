'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Badge } from '@ui-kit/badge'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildJobRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { JobInfoCard } from '@/components/k8s/jobs/JobInfoCard'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { JobDetail } from '@domain-k8s/types/job'
import type { PodSummary } from '@domain-k8s/types/pod'

interface JobInspectorProps {
  detail?: DetailResponse<JobDetail>
  isLoading?: boolean
}

export function JobInspector({ detail, isLoading }: JobInspectorProps) {
  const summary = detail?.summary

  const podsQuery = useK8sResourceList<PodSummary>({
    resourceBase: 'pods',
    namespace: summary?.namespace,
    params: summary
      ? {
          labelSelector: `job-name=${summary.name}`,
          limit: 50,
        }
      : undefined,
    enabled: Boolean(summary?.namespace),
  })

  const relations = useMemo(
    () => buildJobRelations(summary, podsQuery.data?.items, detail?.raw),
    [summary, podsQuery.data?.items, detail?.raw],
  )

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <JobInfoCard summary={summary} />,
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
          content: <JobStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <JobReferenceCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="jobs"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="Job"
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

function JobStatusCard({ summary }: { summary: JobDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Job Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <Info label="Completions" value={summary.completions ?? '—'} />
          <Info label="Succeeded" value={summary.succeeded} />
          <Info label="Failed" value={summary.failed} />
          <Info label="Active" value={summary.active} />
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

function JobReferenceCard({ summary }: { summary: JobDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Execution Policy</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info
          label="Completion Mode"
          value={summary.completionMode ?? 'NonIndexed'}
        />
        <Info label="Parallelism" value={summary.parallelism ?? '—'} />
        <Info label="Backoff Limit" value={summary.backoffLimit ?? 'Default'} />
        <Info
          label="Active Deadline"
          value={
            summary.activeDeadlineSeconds
              ? `${summary.activeDeadlineSeconds}s`
              : 'None'
          }
        />
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
