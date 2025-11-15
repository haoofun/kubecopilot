'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { PodDetail, PodSummary } from '@domain-k8s/types/pod'

import { ResourcePageFactory } from '@/components/resources/ResourcePageFactory'
import type { ResourcePageConfig } from '@/components/resources/ResourcePageFactory'
import { PodInspector } from '@/components/resources/inspectors/PodInspector'

const POD_STATUS_OPTIONS = [
  { label: 'Running', value: 'Running' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Succeeded', value: 'Succeeded' },
  { label: 'Unknown', value: 'Unknown' },
]

const podColumns = [
  {
    header: 'Name',
    cell: (row: PodSummary) => row.name,
  },
  {
    header: 'Namespace',
    cell: (row: PodSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Status',
    cell: (row: PodSummary) => row.status,
  },
  {
    header: 'Restarts',
    cell: (row: PodSummary) => row.restarts,
  },
  {
    header: 'Node',
    cell: (row: PodSummary) => row.nodeName ?? '—',
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Pod IP',
    cell: (row: PodSummary) => row.ip ?? '—',
    className: 'hidden xl:table-cell',
  },
  {
    header: 'Age',
    cell: (row: PodSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden lg:table-cell text-muted-foreground text-sm',
  },
]

const podPageConfig: ResourcePageConfig<PodSummary, PodDetail> = {
  resourceBase: 'pods',
  kind: 'Pod',
  namespaced: true,
  statusOptions: POD_STATUS_OPTIONS,
  columns: podColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  getStatus: (row) => row.status,
  getSearchValues: (row) => [row.name, row.nodeName ?? ''],
  inspector: PodInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No pods match the current filters.',
}

export default function PodsResourcePage() {
  return <ResourcePageFactory config={podPageConfig} />
}
