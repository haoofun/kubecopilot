'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { CronJobDetail, CronJobSummary } from '@domain-k8s/types/cronjob'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { CronJobInspector } from '@/components/resources/inspectors/CronJobInspector'

const CRONJOB_STATUS_OPTIONS = [
  { label: 'Active Jobs', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
]

const cronJobColumns = [
  { header: 'Name', cell: (row: CronJobSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: CronJobSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Schedule',
    cell: (row: CronJobSummary) => row.schedule,
  },
  {
    header: 'Suspend',
    cell: (row: CronJobSummary) => (row.suspend ? 'Yes' : 'No'),
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Active Jobs',
    cell: (row: CronJobSummary) => row.active,
  },
  {
    header: 'Last Schedule',
    cell: (row: CronJobSummary) =>
      row.lastScheduleTime
        ? formatRelativeTime(row.lastScheduleTime, { addSuffix: true })
        : '—',
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const cronJobConfig: ResourcePageConfig<CronJobSummary, CronJobDetail> = {
  resourceBase: 'cronjobs',
  kind: 'CronJob',
  namespaced: true,
  statusOptions: CRONJOB_STATUS_OPTIONS,
  columns: cronJobColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  inspector: CronJobInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  filterFn: ({ filters, row, matchesSearch, matchesTimeRange }) => {
    let matchesStatus = true
    if (filters.status === 'active') {
      matchesStatus = row.active > 0
    } else if (filters.status === 'suspended') {
      matchesStatus = row.suspend
    }
    return matchesStatus && matchesSearch && matchesTimeRange
  },
  emptyMessage: 'No cronjobs match the current filters.',
}

export default function CronJobsResourcePage() {
  return <ResourcePageFactory config={cronJobConfig} />
}
