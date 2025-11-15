'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { NamespaceSummary } from '@domain-k8s/types/namespace'

interface NamespaceRow {
  name: string
  status: string
  age: string
  labels: string
}

const columns: ColumnDef<NamespaceRow>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (item) => item.name,
    className: 'w-[200px]',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (item) => item.status,
    className: 'w-[150px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[100px]',
  },
  {
    header: 'Labels',
    accessorKey: 'labels',
    cell: (item) => item.labels,
    className: 'w-[100px]',
  },
]

export function NamespaceTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<NamespaceSummary>({
      resourceBase: 'namespaces',
    })

  const rows: NamespaceRow[] =
    data?.items.map((ns) => ({
      name: ns.name,
      status: ns.status,
      age: ns.creationTimestamp,
      labels: '—',
    })) ?? []

  return (
    <ResourceTable<NamespaceRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => item.name}
      linkGenerator={(item) => `/namespaces/${item.name}`}
    />
  )
}
