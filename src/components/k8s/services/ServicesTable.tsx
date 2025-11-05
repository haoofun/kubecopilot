'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { ServiceSummary } from '@/lib/k8s/types/service'

interface ServiceRow {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIP: string
  ports: string
  age: string
}

const columns: ColumnDef<ServiceRow>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (item) => item.name,
    className: 'w-[200px]',
  },
  {
    header: 'Namespace',
    accessorKey: 'namespace',
    cell: (item) => item.namespace,
    className: 'w-[150px]',
  },
  {
    header: 'Type',
    accessorKey: 'type',
    cell: (item) => item.type,
    className: 'w-[100px]',
  },
  {
    header: 'Cluster IP',
    accessorKey: 'clusterIP',
    cell: (item) => item.clusterIP,
    className: 'w-[100px]',
  },
  {
    header: 'External IP',
    accessorKey: 'externalIP',
    cell: (item) => item.externalIP,
    className: 'w-[100px]',
  },
  {
    header: 'Ports',
    accessorKey: 'ports',
    cell: (item) => item.ports,
    className: 'w-[100px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[100px]',
  },
]

export function ServicesTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<ServiceSummary>({
      resourceBase: 'services',
    })

  const rows: ServiceRow[] =
    data?.items.map((service) => ({
      name: service.name,
      namespace: service.namespace,
      type: service.type,
      clusterIP: service.clusterIP,
      externalIP: service.externalIPs.join(', ') || 'None',
      ports: service.ports.join(', '),
      age: service.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<ServiceRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/services/${item.namespace}/${item.name}`}
    />
  )
}
