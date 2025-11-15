'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { PVDetail, PVSummary } from '@domain-k8s/types/pv'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { PVInspector } from '@/components/resources/inspectors/PVInspector'

const PV_STATUS_OPTIONS = [
  { label: 'Available', value: 'Available' },
  { label: 'Bound', value: 'Bound' },
  { label: 'Released', value: 'Released' },
  { label: 'Failed', value: 'Failed' },
]

const pvColumns = [
  { header: 'Name', cell: (row: PVSummary) => row.name },
  {
    header: 'Storage Class',
    cell: (row: PVSummary) => row.storageClass ?? '—',
    className: 'hidden md:table-cell',
  },
  {
    header: 'Capacity',
    cell: (row: PVSummary) => row.capacity ?? '—',
  },
  {
    header: 'Status',
    cell: (row: PVSummary) => row.status ?? '—',
  },
  {
    header: 'Age',
    cell: (row: PVSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden lg:table-cell text-muted-foreground text-sm',
  },
]

const pvConfig: ResourcePageConfig<PVSummary, PVDetail> = {
  resourceBase: 'pvs',
  kind: 'PersistentVolume',
  namespaced: false,
  showNamespaceFilter: false,
  statusOptions: PV_STATUS_OPTIONS,
  columns: pvColumns,
  getRowId: (row) => row.name,
  getName: (row) => row.name,
  getCreationTimestamp: (row) => row.creationTimestamp,
  getStatus: (row) => row.status ?? '',
  inspector: PVInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No persistent volumes match the current filters.',
}

export default function PVsResourcePage() {
  return <ResourcePageFactory config={pvConfig} />
}
