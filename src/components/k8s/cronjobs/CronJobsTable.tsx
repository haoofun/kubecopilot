'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { CronJobSummary } from '@domain-k8s/types/cronjob'

interface CronJobRow {
  name: string
  namespace: string
  schedule: string
  suspend: string
  active: number
  lastSchedule?: string
  age: string
}

const columns: ColumnDef<CronJobRow>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (item) => item.name,
    className: 'w-[240px]',
  },
  {
    header: 'Namespace',
    accessorKey: 'namespace',
    cell: (item) => item.namespace,
    className: 'w-[150px]',
  },
  {
    header: 'Schedule',
    accessorKey: 'schedule',
    cell: (item) => item.schedule,
    className: 'w-[160px]',
  },
  {
    header: 'Suspend',
    accessorKey: 'suspend',
    cell: (item) => item.suspend,
    className: 'w-[100px]',
  },
  {
    header: 'Active Jobs',
    accessorKey: 'active',
    cell: (item) => item.active,
    className: 'w-[120px]',
  },
  {
    header: 'Last Schedule',
    accessorKey: 'lastSchedule',
    cell: (item) => item.lastSchedule,
    className: 'w-[160px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function CronJobsTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<CronJobSummary>({
      resourceBase: 'cronjobs',
    })

  const rows: CronJobRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      schedule: item.schedule,
      suspend: item.suspend ? 'Yes' : 'No',
      active: item.active,
      lastSchedule: formatRelativeTime(item.lastScheduleTime, {
        addSuffix: true,
      }),
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<CronJobRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/cronjobs/${item.namespace}/${item.name}`}
    />
  )
}
