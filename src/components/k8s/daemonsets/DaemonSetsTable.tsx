'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { DaemonSetSummary } from '@/lib/k8s/types/daemonset'

interface DaemonSetRow {
  name: string
  namespace: string
  desired: number
  current: number
  ready: number
  updated: number
  age: string
}

const columns: ColumnDef<DaemonSetRow>[] = [
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
    header: 'Desired',
    accessorKey: 'desired',
    cell: (item) => item.desired,
    className: 'w-[100px]',
  },
  {
    header: 'Current',
    accessorKey: 'current',
    cell: (item) => item.current,
    className: 'w-[100px]',
  },
  {
    header: 'Ready',
    accessorKey: 'ready',
    cell: (item) => item.ready,
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

export function DaemonSetsTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<DaemonSetSummary>({
      resourceBase: 'daemonsets',
    })

  const rows: DaemonSetRow[] =
    data?.items.map((item) => ({
      name: item.name,
      namespace: item.namespace,
      desired: item.desiredPods,
      current: item.currentPods,
      ready: item.readyPods,
      updated: item.updatedPods,
      age: item.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<DaemonSetRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/daemonsets/${item.namespace}/${item.name}`}
    />
  )
}
