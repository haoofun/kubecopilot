'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type {
  StatefulSetDetail,
  StatefulSetSummary,
} from '@domain-k8s/types/statefulset'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { StatefulSetInspector } from '@/components/resources/inspectors/StatefulSetInspector'

const STATEFULSET_STATUS_OPTIONS = [
  { label: 'Healthy', value: 'healthy' },
  { label: 'Updating', value: 'updating' },
  { label: 'Degraded', value: 'degraded' },
]

const statefulSetColumns = [
  { header: 'Name', cell: (row: StatefulSetSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: StatefulSetSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Ready',
    cell: (row: StatefulSetSummary) =>
      `${row.readyReplicas}/${row.desiredReplicas}`,
  },
  {
    header: 'Current',
    cell: (row: StatefulSetSummary) => row.currentReplicas,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Updated',
    cell: (row: StatefulSetSummary) => row.updatedReplicas,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Age',
    cell: (row: StatefulSetSummary) =>
      formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const statefulSetConfig: ResourcePageConfig<
  StatefulSetSummary,
  StatefulSetDetail
> = {
  resourceBase: 'statefulsets',
  kind: 'StatefulSet',
  namespaced: true,
  statusOptions: STATEFULSET_STATUS_OPTIONS,
  columns: statefulSetColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  inspector: StatefulSetInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  filterFn: ({ filters, row, matchesSearch, matchesTimeRange }) => {
    const desired = row.desiredReplicas ?? 0
    const ready = row.readyReplicas ?? 0
    const updated = row.updatedReplicas ?? 0
    let matchesStatus = true
    if (filters.status === 'healthy') {
      matchesStatus = desired === 0 ? true : ready === desired
    } else if (filters.status === 'updating') {
      matchesStatus = updated < desired
    } else if (filters.status === 'degraded') {
      matchesStatus = ready < desired && desired > 0
    }
    return matchesStatus && matchesSearch && matchesTimeRange
  },
  emptyMessage: 'No statefulsets match the current filters.',
}

export default function StatefulSetsResourcePage() {
  return <ResourcePageFactory config={statefulSetConfig} />
}
