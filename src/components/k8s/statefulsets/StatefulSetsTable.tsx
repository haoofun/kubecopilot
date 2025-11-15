'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { StatefulSetSummary } from '@domain-k8s/types/statefulset'

interface StatefulSetRow {
  name: string
  namespace: string
  ready: string
  current: number
  updated: number
  age: string
}

const columns: ColumnDef<StatefulSetRow>[] = [
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
    header: 'Ready',
    accessorKey: 'ready',
    cell: (item) => item.ready,
    className: 'w-[120px]',
  },
  {
    header: 'Current',
    accessorKey: 'current',
    cell: (item) => item.current,
    className: 'w-[100px]',
  },
  {
    header: 'Updated',
    accessorKey: 'updated',
    cell: (item) => item.updated,
    className: 'w-[100px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function StatefulSetsTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<StatefulSetSummary>({
      resourceBase: 'statefulsets',
    })

  const rows: StatefulSetRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      ready: `${item.readyReplicas}/${item.desiredReplicas}`,
      current: item.currentReplicas,
      updated: item.updatedReplicas,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<StatefulSetRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/statefulsets/${item.namespace}/${item.name}`}
    />
  )
}
