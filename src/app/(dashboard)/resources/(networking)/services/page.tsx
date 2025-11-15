'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type { ServiceDetail, ServiceSummary } from '@domain-k8s/types/service'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { ServiceInspector } from '@/components/resources/inspectors/ServiceInspector'

const SERVICE_STATUS_OPTIONS = [
  { label: 'ClusterIP', value: 'ClusterIP' },
  { label: 'NodePort', value: 'NodePort' },
  { label: 'LoadBalancer', value: 'LoadBalancer' },
  { label: 'ExternalName', value: 'ExternalName' },
]

const serviceColumns = [
  { header: 'Name', cell: (row: ServiceSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: ServiceSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Type',
    cell: (row: ServiceSummary) => row.type,
  },
  {
    header: 'Cluster IP',
    cell: (row: ServiceSummary) => row.clusterIP || '—',
    className: 'hidden lg:table-cell',
  },
  {
    header: 'External IPs',
    cell: (row: ServiceSummary) =>
      row.externalIPs.length ? row.externalIPs.join(', ') : 'None',
    className: 'hidden xl:table-cell',
  },
  {
    header: 'Ports',
    cell: (row: ServiceSummary) =>
      row.ports.length ? row.ports.join(', ') : '—',
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Age',
    cell: (row: ServiceSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const serviceConfig: ResourcePageConfig<ServiceSummary, ServiceDetail> = {
  resourceBase: 'services',
  kind: 'Service',
  namespaced: true,
  statusOptions: SERVICE_STATUS_OPTIONS,
  columns: serviceColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  getStatus: (row) => row.type,
  getSearchValues: (row) => [row.name, row.clusterIP ?? ''],
  inspector: ServiceInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
  }),
  emptyMessage: 'No services match the current filters.',
}

export default function ServicesResourcePage() {
  return <ResourcePageFactory config={serviceConfig} />
}
