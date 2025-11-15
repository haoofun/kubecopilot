'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { PVSummary } from '@domain-k8s/types/pv'

interface PVRow {
  name: string
  storageClass?: string
  capacity?: string
  status?: string
  age: string
}

const columns: ColumnDef<PVRow>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (item) => item.name,
    className: 'w-[260px]',
  },
  {
    header: 'StorageClass',
    accessorKey: 'storageClass',
    cell: (item) => item.storageClass ?? '—',
    className: 'w-[160px]',
  },
  {
    header: 'Capacity',
    accessorKey: 'capacity',
    cell: (item) => item.capacity ?? '—',
    className: 'w-[130px]',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (item) => item.status ?? 'Unknown',
    className: 'w-[130px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function PVsTable() {
  const { data, isLoading, isError, error } = useK8sResourceList<PVSummary>({
    resourceBase: 'pvs',
  })

  const rows: PVRow[] =
    data?.items.map((item) => ({
      name: item.name,
      storageClass: item.storageClass,
      capacity: item.capacity,
      status: item.status,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<PVRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => item.name}
      linkGenerator={(item) => `/pvs/${item.name}`}
    />
  )
}
