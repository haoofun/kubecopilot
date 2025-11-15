'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { JobDetail, JobSummary } from '@domain-k8s/types/job'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { JobInspector } from '@/components/resources/inspectors/JobInspector'

const JOB_STATUS_OPTIONS = [
  { label: 'Running', value: 'running' },
  { label: 'Succeeded', value: 'succeeded' },
  { label: 'Failed', value: 'failed' },
]

const jobColumns = [
  { header: 'Name', cell: (row: JobSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: JobSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Completions',
    cell: (row: JobSummary) => row.completions ?? '—',
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Succeeded',
    cell: (row: JobSummary) => row.succeeded,
  },
  {
    header: 'Failed',
    cell: (row: JobSummary) => row.failed,
  },
  {
    header: 'Active',
    cell: (row: JobSummary) => row.active,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Age',
    cell: (row: JobSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const jobConfig: ResourcePageConfig<JobSummary, JobDetail> = {
  resourceBase: 'jobs',
  kind: 'Job',
  namespaced: true,
  statusOptions: JOB_STATUS_OPTIONS,
  columns: jobColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  inspector: JobInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  filterFn: ({ filters, row, matchesSearch, matchesTimeRange }) => {
    let matchesStatus = true
    if (filters.status === 'running') {
      matchesStatus = row.active > 0
    } else if (filters.status === 'succeeded') {
      matchesStatus = row.active === 0 && row.failed === 0 && row.succeeded > 0
    } else if (filters.status === 'failed') {
      matchesStatus = row.failed > 0
    }
    return matchesStatus && matchesSearch && matchesTimeRange
  },
  emptyMessage: 'No jobs match the current filters.',
}

export default function JobsResourcePage() {
  return <ResourcePageFactory config={jobConfig} />
}
