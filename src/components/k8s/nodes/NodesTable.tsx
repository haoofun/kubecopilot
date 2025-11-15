'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { NodeSummary } from '@domain-k8s/types/node'

interface NodeRow {
  name: string
  roles: string
  status: string
  osImage?: string
  age: string
}

const columns: ColumnDef<NodeRow>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (item) => item.name,
    className: 'w-[260px]',
  },
  {
    header: 'Roles',
    accessorKey: 'roles',
    cell: (item) => item.roles,
    className: 'w-[150px]',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (item) => item.status,
    className: 'w-[120px]',
  },
  {
    header: 'OS Image',
    accessorKey: 'osImage',
    cell: (item) => item.osImage ?? '—',
    className: 'w-[220px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function NodesTable() {
  const { data, isLoading, isError, error } = useK8sResourceList<NodeSummary>({
    resourceBase: 'nodes',
  })

  const rows: NodeRow[] =
    data?.items.map((item) => ({
      name: item.name,
      roles: item.roles.join(', '),
      status: item.status,
      osImage: item.osImage,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<NodeRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => item.name}
      linkGenerator={(item) => `/nodes/${item.name}`}
    />
  )
}
