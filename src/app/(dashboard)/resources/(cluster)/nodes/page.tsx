'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { NodeDetail, NodeSummary } from '@domain-k8s/types/node'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { NodeInspector } from '@/components/resources/inspectors/NodeInspector'

const NODE_STATUS_OPTIONS = [
  { label: 'Ready', value: 'Ready' },
  { label: 'NotReady', value: 'NotReady' },
]

const nodeColumns = [
  { header: 'Name', cell: (row: NodeSummary) => row.name },
  {
    header: 'Status',
    cell: (row: NodeSummary) => row.status,
  },
  {
    header: 'Roles',
    cell: (row: NodeSummary) => row.roles.join(', ') || '—',
    className: 'hidden lg:table-cell',
  },
  {
    header: 'OS Image',
    cell: (row: NodeSummary) => row.osImage ?? '—',
    className: 'hidden xl:table-cell',
  },
  {
    header: 'Age',
    cell: (row: NodeSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden lg:table-cell text-muted-foreground text-sm',
  },
]

const nodeConfig: ResourcePageConfig<NodeSummary, NodeDetail> = {
  resourceBase: 'nodes',
  kind: 'Node',
  namespaced: false,
  showNamespaceFilter: false,
  statusOptions: NODE_STATUS_OPTIONS,
  columns: nodeColumns,
  getRowId: (row) => row.name,
  getName: (row) => row.name,
  getCreationTimestamp: (row) => row.creationTimestamp,
  getStatus: (row) => row.status,
  inspector: NodeInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No nodes match the current filters.',
}

export default function NodesResourcePage() {
  return <ResourcePageFactory config={nodeConfig} />
}
