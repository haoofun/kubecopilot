'use client'

import { useState } from 'react'

import { ResourceTable, ColumnDef } from '@/components/k8s/shared/ResourceTable'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { Badge } from '@ui-kit/badge'
import { Button } from '@ui-kit/button'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { PodSummary } from '@domain-k8s/types/pod'

interface PodRow {
  name: string
  namespace: string
  status: string
  restarts: number
  node: string
  podIP: string
  age: string
  controlledBy: string
  cpu: string
  memory: string
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      label: string
    }
  > = {
    Running: { variant: 'default', label: 'Running' },
    Pending: { variant: 'secondary', label: 'Pending' },
    Succeeded: { variant: 'outline', label: 'Succeeded' },
    Failed: { variant: 'destructive', label: 'Failed' },
    Unknown: { variant: 'secondary', label: 'Unknown' },
    ContainerCreating: { variant: 'secondary', label: 'Creating' },
    CrashLoopBackOff: { variant: 'destructive', label: 'CrashLoop' },
    ImagePullBackOff: { variant: 'destructive', label: 'ImagePull' },
    ErrImagePull: { variant: 'destructive', label: 'ImageError' },
  }

  const config = statusMap[status] || {
    variant: 'outline' as const,
    label: status,
  }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

const columns: ColumnDef<PodRow>[] = [
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
    header: 'Status',
    accessorKey: 'status',
    cell: (item) => getStatusBadge(item.status),
    className: 'w-[100px]',
  },
  {
    header: 'Restarts',
    accessorKey: 'restarts',
    cell: (item) => item.restarts,
    className: 'w-[50px]',
  },
  {
    header: 'Node',
    accessorKey: 'node',
    cell: (item) => item.node,
    className: 'w-[100px]',
  },
  {
    header: 'Pod IP',
    accessorKey: 'podIP',
    cell: (item) => item.podIP,
    className: 'w-[100px]',
  },
  {
    header: 'Age',
    accessorKey: 'age',
    cell: (item) => formatRelativeTime(item.age),
    className: 'w-[150px]',
  },
  {
    header: 'Controlled By',
    accessorKey: 'controlledBy',
    cell: (item) => item.controlledBy,
    className: 'w-[100px]',
  },
  {
    header: 'CPU (req/lim)',
    accessorKey: 'cpu',
    cell: (item) => item.cpu,
    className: 'w-[160px]',
  },
  {
    header: 'Memory (req/lim)',
    accessorKey: 'memory',
    cell: (item) => item.memory,
    className: 'w-[180px]',
  },
]

const formatResourceAggregate = (
  requests?: string,
  limits?: string,
): string => {
  if (requests && limits) {
    return `${requests} / ${limits}`
  }
  if (requests) {
    return `${requests} / —`
  }
  if (limits) {
    return `— / ${limits}`
  }
  return '—'
}

export function PodsTable() {
  const [showTerminated, setShowTerminated] = useState(false)

  const { data, isLoading, isError, error } = useK8sResourceList<PodSummary>({
    resourceBase: 'pods',
    params: showTerminated
      ? undefined
      : {
          fieldSelector: 'status.phase!=Succeeded,status.phase!=Failed',
        },
  })

  const rows: PodRow[] =
    data?.items.map((pod) => ({
      name: pod.name,
      namespace: pod.namespace,
      status: pod.status,
      restarts: pod.restarts,
      node: pod.nodeName ?? 'N/A',
      podIP: pod.ip,
      age: pod.creationTimestamp,
      controlledBy: pod.owner ? `${pod.owner.kind}/${pod.owner.name}` : 'N/A',
      cpu: formatResourceAggregate(
        pod.resources.requests.cpu,
        pod.resources.limits.cpu,
      ),
      memory: formatResourceAggregate(
        pod.resources.requests.memory,
        pod.resources.limits.memory,
      ),
    })) ?? []

  return (
    <ResourceTable<PodRow>
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      error={error ?? null}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/pods/${item.namespace}/${item.name}`}
      toolbar={
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant={showTerminated ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowTerminated((prev) => !prev)}
          >
            {showTerminated ? 'Hide terminated pods' : 'Show terminated pods'}
          </Button>
        </div>
      }
      virtualization={{ enabled: true, maxHeight: 480, rowHeight: 54 }}
    />
  )
}
