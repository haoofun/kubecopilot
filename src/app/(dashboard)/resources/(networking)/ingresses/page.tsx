'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { IngressDetail, IngressSummary } from '@domain-k8s/types/ingress'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { IngressInspector } from '@/components/resources/inspectors/IngressInspector'

const INGRESS_STATUS_OPTIONS = [
  { label: 'Has Hosts', value: 'hosts' },
  { label: 'No Hosts', value: 'no-hosts' },
]

const ingressColumns = [
  { header: 'Name', cell: (row: IngressSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: IngressSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Hosts',
    cell: (row: IngressSummary) =>
      row.hosts.length ? row.hosts.join(', ') : '—',
  },
  {
    header: 'Services',
    cell: (row: IngressSummary) => row.serviceCount,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Age',
    cell: (row: IngressSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const ingressConfig: ResourcePageConfig<IngressSummary, IngressDetail> = {
  resourceBase: 'ingresses',
  kind: 'Ingress',
  namespaced: true,
  statusOptions: INGRESS_STATUS_OPTIONS,
  columns: ingressColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  inspector: IngressInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  filterFn: ({ filters, row, matchesSearch, matchesTimeRange }) => {
    let matchesStatus = true
    if (filters.status === 'hosts') {
      matchesStatus = row.hosts.length > 0
    } else if (filters.status === 'no-hosts') {
      matchesStatus = row.hosts.length === 0
    }
    return matchesStatus && matchesSearch && matchesTimeRange
  },
  emptyMessage: 'No ingresses match the current filters.',
}

export default function IngressesResourcePage() {
  return <ResourcePageFactory config={ingressConfig} />
}
