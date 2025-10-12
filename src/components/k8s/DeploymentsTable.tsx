'use client'

import { ResourceTable, ColumnDef } from './ResourceTable'

interface Deployment {
  name: string
  namespace: string
  ready: string
  upToDate: number
  available: number
  age: string
}

const columns: ColumnDef<Deployment>[] = [
  { header: 'Name', cell: (item) => item.name, className: 'w-[250px]' },
  {
    header: 'Namespace',
    cell: (item) => item.namespace,
    className: 'w-[150px]',
  },
  { header: 'Ready', cell: (item) => item.ready, className: 'w-[50px]' },
  {
    header: 'Up-to-date',
    cell: (item) => item.upToDate,
    className: 'w-[100px]',
  },
  {
    header: 'Available',
    cell: (item) => item.available,
    className: 'w-[100px]',
  },
  { header: 'Age', cell: (item) => item.age, className: 'w-[150px]' },
]

export function DeploymentsTable() {
  return (
    <ResourceTable<Deployment>
      resource="deployments"
      columns={columns}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/deployments/${item.namespace}/${item.name}`}
    />
  )
}
