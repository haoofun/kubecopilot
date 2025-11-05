'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { ConfigMapSummary } from '@/lib/k8s/types/configmap'

interface ConfigMapRow {
  name: string
  namespace: string
  dataCount: number
  age: string
}

const columns: ColumnDef<ConfigMapRow>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (item) => item.name,
    className: 'w-[260px]',
  },
  {
    header: 'Namespace',
    accessorKey: 'namespace',
    cell: (item) => item.namespace,
    className: 'w-[160px]',
  },
  {
    header: 'Entries',
    accessorKey: 'dataCount',
    cell: (item) => item.dataCount,
    className: 'w-[100px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function ConfigMapsTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<ConfigMapSummary>({
      resourceBase: 'configmaps',
    })

  const rows: ConfigMapRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      dataCount: item.dataCount,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<ConfigMapRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/configmaps/${item.namespace}/${item.name}`}
    />
  )
}
