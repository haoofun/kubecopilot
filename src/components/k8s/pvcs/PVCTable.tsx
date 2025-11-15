'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { PVCSummary } from '@domain-k8s/types/pvc'

interface PVCRow {
  name: string
  namespace: string
  storageClass?: string
  storage?: string
  phase?: string
  age: string
}

const columns: ColumnDef<PVCRow>[] = [
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
    header: 'StorageClass',
    accessorKey: 'storageClass',
    cell: (item) => item.storageClass ?? '—',
    className: 'w-[160px]',
  },
  {
    header: 'Requested',
    accessorKey: 'storage',
    cell: (item) => item.storage ?? '—',
    className: 'w-[120px]',
  },
  {
    header: 'Phase',
    accessorKey: 'phase',
    cell: (item) => item.phase ?? 'Unknown',
    className: 'w-[120px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function PVCTable() {
  const { data, isLoading, isError, error } = useK8sResourceList<PVCSummary>({
    resourceBase: 'pvcs',
  })

  const rows: PVCRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      storageClass: item.storageClass,
      storage: item.storage,
      phase: item.phase,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<PVCRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/pvcs/${item.namespace}/${item.name}`}
    />
  )
}
