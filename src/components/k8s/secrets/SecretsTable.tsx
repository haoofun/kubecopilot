'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { SecretSummary } from '@domain-k8s/types/secret'

interface SecretRow {
  name: string
  namespace: string
  type: string
  dataCount: number
  age: string
}

const columns: ColumnDef<SecretRow>[] = [
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
    header: 'Type',
    accessorKey: 'type',
    cell: (item) => item.type,
    className: 'w-[160px]',
  },
  {
    header: 'Entries',
    accessorKey: 'dataCount',
    cell: (item) => item.dataCount,
    className: 'w-[110px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function SecretsTable() {
  const { data, isLoading, isError, error } = useK8sResourceList<SecretSummary>(
    {
      resourceBase: 'secrets',
    },
  )

  const rows: SecretRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      type: item.type,
      dataCount: item.dataCount,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<SecretRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/secrets/${item.namespace}/${item.name}`}
    />
  )
}
