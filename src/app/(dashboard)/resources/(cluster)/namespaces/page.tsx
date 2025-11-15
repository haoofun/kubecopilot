'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type {
  NamespaceDetail,
  NamespaceSummary,
} from '@domain-k8s/types/namespace'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { NamespaceInspector } from '@/components/resources/inspectors/NamespaceInspector'

const NAMESPACE_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Terminating', value: 'Terminating' },
]

const namespaceColumns = [
  { header: 'Name', cell: (row: NamespaceSummary) => row.name },
  {
    header: 'Status',
    cell: (row: NamespaceSummary) => row.status,
  },
  {
    header: 'Age',
    cell: (row: NamespaceSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden lg:table-cell text-muted-foreground text-sm',
  },
]

const namespaceConfig: ResourcePageConfig<NamespaceSummary, NamespaceDetail> = {
  resourceBase: 'namespaces',
  kind: 'Namespace',
  namespaced: false,
  showNamespaceFilter: false,
  statusOptions: NAMESPACE_STATUS_OPTIONS,
  columns: namespaceColumns,
  getRowId: (row) => row.name,
  getName: (row) => row.name,
  getCreationTimestamp: (row) => row.creationTimestamp,
  getStatus: (row) => row.status,
  inspector: NamespaceInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No namespaces match the current filters.',
}

export default function NamespacesResourcePage() {
  return <ResourcePageFactory config={namespaceConfig} />
}
