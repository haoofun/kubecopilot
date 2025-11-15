'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { PVCDetail, PVCSummary } from '@domain-k8s/types/pvc'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { PVCInspector } from '@/components/resources/inspectors/PVCInspector'

const PVC_STATUS_OPTIONS = [
  { label: 'Bound', value: 'Bound' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Lost', value: 'Lost' },
]

const pvcColumns = [
  { header: 'Name', cell: (row: PVCSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: PVCSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Storage Class',
    cell: (row: PVCSummary) => row.storageClass ?? '—',
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Requested',
    cell: (row: PVCSummary) => row.storage ?? '—',
  },
  {
    header: 'Phase',
    cell: (row: PVCSummary) => row.phase ?? '—',
  },
  {
    header: 'Age',
    cell: (row: PVCSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const pvcConfig: ResourcePageConfig<PVCSummary, PVCDetail> = {
  resourceBase: 'pvcs',
  kind: 'PersistentVolumeClaim',
  namespaced: true,
  statusOptions: PVC_STATUS_OPTIONS,
  columns: pvcColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  getStatus: (row) => row.phase ?? '',
  inspector: PVCInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No persistent volume claims match the current filters.',
}

export default function PVCsResourcePage() {
  return <ResourcePageFactory config={pvcConfig} />
}
