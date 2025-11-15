'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Badge } from '@ui-kit/badge'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import {
  buildCronJobRelations,
  formatLabelSelector,
} from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { CronJobInfoCard } from '@/components/k8s/cronjobs/CronJobInfoCard'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { CronJobDetail } from '@domain-k8s/types/cronjob'
import type { JobSummary } from '@domain-k8s/types/job'

interface CronJobInspectorProps {
  detail?: DetailResponse<CronJobDetail>
  isLoading?: boolean
}

export function CronJobInspector({ detail, isLoading }: CronJobInspectorProps) {
  const summary = detail?.summary
  const selector = formatLabelSelector(summary?.selector)

  const jobsQuery = useK8sResourceList<JobSummary>({
    resourceBase: 'jobs',
    namespace: summary?.namespace,
    params: selector
      ? {
          labelSelector: selector,
          limit: 20,
        }
      : undefined,
    enabled: Boolean(summary?.namespace && selector),
  })

  const relations = useMemo(
    () => buildCronJobRelations(summary, jobsQuery.data?.items),
    [summary, jobsQuery.data?.items],
  )

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: <CronJobInfoCard summary={summary} />,
        },
        {
          id: 'relations',
          label: 'Related',
          content: (
            <ResourceRelations
              relations={relations}
              emptyMessage={
                jobsQuery.isLoading
                  ? 'Loading related resources…'
                  : 'No related resources'
              }
            />
          ),
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <CronJobStatusCard summary={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <CronJobReferenceCard summary={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="cronjobs"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="CronJob"
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

function CronJobStatusCard({ summary }: { summary: CronJobDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Schedule Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <Info label="Schedule" value={summary.schedule} />
          <Info label="Suspend" value={summary.suspend ? 'Yes' : 'No'} />
          <Info label="Active Jobs" value={summary.active} />
          <Info label="Last Run" value={summary.lastScheduleTime ?? '—'} />
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

function CronJobReferenceCard({ summary }: { summary: CronJobDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Concurrency &amp; History</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Concurrency Policy" value={summary.concurrencyPolicy} />
        <Info
          label="Starting Deadline"
          value={
            summary.startingDeadlineSeconds
              ? `${summary.startingDeadlineSeconds}s`
              : 'None'
          }
        />
        <Info
          label="Successful History Limit"
          value={summary.successfulJobsHistoryLimit ?? 'Default'}
        />
        <Info
          label="Failed History Limit"
          value={summary.failedJobsHistoryLimit ?? 'Default'}
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
