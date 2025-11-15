'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type {
  ConfigMapDetail,
  ConfigMapSummary,
} from '@domain-k8s/types/configmap'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { ConfigMapInspector } from '@/components/resources/inspectors/ConfigMapInspector'

const configMapColumns = [
  { header: 'Name', cell: (row: ConfigMapSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: ConfigMapSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Keys',
    cell: (row: ConfigMapSummary) => row.dataCount,
  },
  {
    header: 'Age',
    cell: (row: ConfigMapSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden lg:table-cell text-muted-foreground text-sm',
  },
]

const configMapConfig: ResourcePageConfig<ConfigMapSummary, ConfigMapDetail> = {
  resourceBase: 'configmaps',
  kind: 'ConfigMap',
  namespaced: true,
  columns: configMapColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  inspector: ConfigMapInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No configmaps match the current filters.',
}

export default function ConfigMapsResourcePage() {
  return <ResourcePageFactory config={configMapConfig} />
}
