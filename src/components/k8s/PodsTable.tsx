'use client'

import { ResourceTable, ColumnDef } from './ResourceTable'

interface Pod {
  name: string
  namespace: string
  status: string
  restarts: number
  age: string
}

const columns: ColumnDef<Pod>[] = [
  { header: 'Name', cell: (item) => item.name, className: 'w-[250px]' },
  {
    header: 'Namespace',
    cell: (item) => item.namespace,
    className: 'w-[150px]',
  },
  { header: 'Status', cell: (item) => item.status, className: 'w-[100px]' },
  { header: 'Restarts', cell: (item) => item.restarts, className: 'w-[50px]' },
  { header: 'Age', cell: (item) => item.age, className: 'w-[150px]' },
]

export function PodsTable() {
  return (
    <ResourceTable<Pod>
      resource="pods"
      columns={columns}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/pods/${item.namespace}/${item.name}`}
    />
  )
}
