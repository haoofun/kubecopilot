'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { IngressSummary } from '@domain-k8s/types/ingress'

interface IngressRow {
  name: string
  namespace: string
  hosts: string
  services: number
  age: string
}

const columns: ColumnDef<IngressRow>[] = [
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
    header: 'Hosts',
    accessorKey: 'hosts',
    cell: (item) => item.hosts,
    className: 'w-[220px]',
  },
  {
    header: 'Services',
    accessorKey: 'services',
    cell: (item) => item.services,
    className: 'w-[110px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function IngressesTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<IngressSummary>({
      resourceBase: 'ingresses',
    })

  const rows: IngressRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      hosts: item.hosts.length > 0 ? item.hosts.join(', ') : '—',
      services: item.serviceCount,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<IngressRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/ingresses/${item.namespace}/${item.name}`}
    />
  )
}
