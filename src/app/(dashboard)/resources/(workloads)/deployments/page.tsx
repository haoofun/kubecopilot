'use client'

import { formatRelativeTime } from '@/lib/formatters/time'
import type {
  DeploymentDetail,
  DeploymentSummary,
} from '@domain-k8s/types/deployment'

import {
  ResourcePageFactory,
  type ResourcePageConfig,
} from '@/components/resources/ResourcePageFactory'
import { DeploymentInspector } from '@/components/resources/inspectors/DeploymentInspector'

const DEPLOYMENT_STATUS_OPTIONS = [
  { label: 'Healthy (Ready = Desired)', value: 'healthy' },
  { label: 'Progressing', value: 'progressing' },
  { label: 'Degraded', value: 'degraded' },
]

const deploymentColumns = [
  { header: 'Name', cell: (row: DeploymentSummary) => row.name },
  {
    header: 'Namespace',
    cell: (row: DeploymentSummary) => row.namespace,
    className: 'hidden md:table-cell',
  },
  {
    header: 'Ready',
    cell: (row: DeploymentSummary) =>
      `${row.readyReplicas}/${row.desiredReplicas}`,
  },
  {
    header: 'Updated',
    cell: (row: DeploymentSummary) => row.updatedReplicas,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Available',
    cell: (row: DeploymentSummary) => row.availableReplicas,
    className: 'hidden lg:table-cell',
  },
  {
    header: 'Age',
    cell: (row: DeploymentSummary) => formatRelativeTime(row.creationTimestamp),
    className: 'hidden xl:table-cell text-muted-foreground text-sm',
  },
]

const deploymentConfig: ResourcePageConfig<
  DeploymentSummary,
  DeploymentDetail
> = {
  resourceBase: 'deployments',
  kind: 'Deployment',
  namespaced: true,
  statusOptions: DEPLOYMENT_STATUS_OPTIONS,
  columns: deploymentColumns,
  getRowId: (row) => `${row.namespace}/${row.name}`,
  getName: (row) => row.name,
  getNamespace: (row) => row.namespace,
  getCreationTimestamp: (row) => row.creationTimestamp,
  inspector: DeploymentInspector,
  detailParams: () => ({
    includeRaw: 'true',
    includeYaml: 'true',
    includePods: 'true',
  }),
  getSearchValues: (row) => [row.name],
  filterFn: ({ filters, row, matchesSearch, matchesTimeRange }) => {
    let matchesStatus = true
    const desired = row.desiredReplicas ?? 0
    const ready = row.readyReplicas ?? 0
    const available = row.availableReplicas ?? 0
    if (filters.status === 'healthy') {
      matchesStatus = desired === 0 ? true : ready === desired
    } else if (filters.status === 'progressing') {
      matchesStatus = ready < desired && available > 0
    } else if (filters.status === 'degraded') {
      matchesStatus = available === 0 && desired > 0
    }
    return matchesStatus && matchesSearch && matchesTimeRange
  },
  emptyMessage: 'No deployments match the current filters.',
}

export default function DeploymentsResourcePage() {
  return <ResourcePageFactory config={deploymentConfig} />
}
