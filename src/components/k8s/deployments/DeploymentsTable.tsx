'use client'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { DeploymentSummary } from '@domain-k8s/types/deployment'

interface DeploymentRow {
  name: string
  namespace: string
  ready: string
  upToDate: number
  available: number
  age: string
}

const columns: ColumnDef<DeploymentRow>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (item) => item.name,
    className: 'w-[250px]',
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
    className: 'w-[110px]',
  },
  {
    header: 'Up-to-date',
    accessorKey: 'upToDate',
    cell: (item) => item.upToDate,
    className: 'w-[110px]',
  },
  {
    header: 'Available',
    accessorKey: 'available',
    cell: (item) => item.available,
    className: 'w-[110px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
]

export function DeploymentsTable() {
  const { data, isLoading, isError, error } =
    useK8sResourceList<DeploymentSummary>({
      resourceBase: 'deployments',
    })

  const rows: DeploymentRow[] =
    data?.items.map((deployment) => ({
      name: deployment.name,
      namespace: deployment.namespace,
      ready: `${deployment.readyReplicas}/${deployment.desiredReplicas}`,
      upToDate: deployment.updatedReplicas,
      available: deployment.availableReplicas,
      age: deployment.creationTimestamp,
    })) ?? []

  return (
    <ResourceTable<DeploymentRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/deployments/${item.namespace}/${item.name}`}
    />
  )
}
