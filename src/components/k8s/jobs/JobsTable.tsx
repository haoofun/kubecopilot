'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { JobSummary } from '@domain-k8s/types/job'

interface JobRow {
  name: string
  namespace: string
  completions: string
  succeeded: number
  failed: number
  active: number
  age: string
}

const columns: ColumnDef<JobRow>[] = [
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
    header: 'Completions',
    accessorKey: 'completions',
    cell: (item) => item.completions,
    className: 'w-[140px]',
  },
  {
    header: 'Active',
    accessorKey: 'active',
    cell: (item) => item.active,
    className: 'w-[100px]',
  },
  {
    header: 'Succeeded',
    accessorKey: 'succeeded',
    cell: (item) => item.succeeded,
    className: 'w-[110px]',
  },
  {
    header: 'Failed',
    accessorKey: 'failed',
    cell: (item) => item.failed,
    className: 'w-[100px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function JobsTable() {
  const { data, isLoading, isError, error } = useK8sResourceList<JobSummary>({
    resourceBase: 'jobs',
  })

  const rows: JobRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      completions:
        item.completions !== null
          ? `${item.succeeded}/${item.completions}`
          : `${item.succeeded}`,
      succeeded: item.succeeded,
      failed: item.failed,
      active: item.active,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<JobRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/jobs/${item.namespace}/${item.name}`}
    />
  )
}
