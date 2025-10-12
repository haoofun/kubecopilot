'use client'

import { ResourceTable, ColumnDef } from './ResourceTable'

interface Namespace {
  name: string
  status: string
  creationTimestamp: string
}

// TODO: Format the timestamp to a human-readable "Age" (e.g., "2 days ago") in the API route
const columns: ColumnDef<Namespace>[] = [
  { header: 'Name', cell: (item) => item.name, className: 'w-[250px]' },
  { header: 'Status', cell: (item) => item.status, className: 'w-[100px]' },
  {
    header: 'Age',
    cell: (item) => item.creationTimestamp,
    className: 'w-[150px]',
  },
]

export function NamespaceTable() {
  return (
    <ResourceTable<Namespace>
      resource="namespaces"
      columns={columns}
      rowKey={(item) => item.name}
      linkGenerator={(item) => `/namespaces/${item.name}`}
    />
  )
}
