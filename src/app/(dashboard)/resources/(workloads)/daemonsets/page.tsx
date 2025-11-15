'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type {
  DaemonSetDetail,
  DaemonSetSummary,
} from '@domain-k8s/types/daemonset'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { DaemonSetInspector } from '@/components/resources/inspectors/DaemonSetInspector'

const DAEMONSET_STATUS_OPTIONS = [
  { label: 'Healthy', value: 'healthy' },
  { label: 'Updating', value: 'updating' },
  { label: 'Degraded', value: 'degraded' },
]

const daemonSetColumns = [
  { header: 'Name', cell: (row: DaemonSetSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: DaemonSetSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Desired',
    cell: (row: DaemonSetSummary) => row.desiredPods,
  },
  {
    header: 'Current',
    cell: (row: DaemonSetSummary) => row.currentPods,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Ready',
    cell: (row: DaemonSetSummary) => row.readyPods,
  },
  {
    header: 'Updated',
    cell: (row: DaemonSetSummary) => row.updatedPods,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Age',
    cell: (row: DaemonSetSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const daemonSetConfig: ResourcePageConfig<DaemonSetSummary, DaemonSetDetail> = {
  resourceBase: 'daemonsets',
  kind: 'DaemonSet',
  namespaced: true,
  statusOptions: DAEMONSET_STATUS_OPTIONS,
  columns: daemonSetColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  inspector: DaemonSetInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  filterFn: ({ filters, row, matchesSearch, matchesTimeRange }) => {
    let matchesStatus = true
    const desired = row.desiredPods
    const ready = row.readyPods
    const updated = row.updatedPods
    if (filters.status === 'healthy') {
      matchesStatus = desired === 0 ? true : ready === desired
    } else if (filters.status === 'updating') {
      matchesStatus = updated < desired
    } else if (filters.status === 'degraded') {
      matchesStatus = ready < desired && desired > 0
    }
    return matchesStatus && matchesSearch && matchesTimeRange
  },
  emptyMessage: 'No daemonsets match the current filters.',
}

export default function DaemonSetsResourcePage() {
  return <ResourcePageFactory config={daemonSetConfig} />
}
