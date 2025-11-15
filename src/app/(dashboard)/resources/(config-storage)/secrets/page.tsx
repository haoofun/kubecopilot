'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { SecretDetail, SecretSummary } from '@domain-k8s/types/secret'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { SecretInspector } from '@/components/resources/inspectors/SecretInspector'

const SECRET_STATUS_OPTIONS = [
  { label: 'Opaque', value: 'Opaque' },
  { label: 'TLS', value: 'kubernetes.io/tls' },
  { label: 'Docker Config', value: 'kubernetes.io/dockerconfigjson' },
]

const secretColumns = [
  { header: 'Name', cell: (row: SecretSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: SecretSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Type',
    cell: (row: SecretSummary) => row.type,
  },
  {
    header: 'Keys',
    cell: (row: SecretSummary) => row.dataCount,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Age',
    cell: (row: SecretSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const secretConfig: ResourcePageConfig<SecretSummary, SecretDetail> = {
  resourceBase: 'secrets',
  kind: 'Secret',
  namespaced: true,
  statusOptions: SECRET_STATUS_OPTIONS,
  columns: secretColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  getStatus: (row) => row.type,
  inspector: SecretInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No secrets match the current filters.',
}

export default function SecretsResourcePage() {
  return <ResourcePageFactory config={secretConfig} />
}
