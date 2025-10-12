'use client'

import { ResourceTable, ColumnDef } from './ResourceTable'

interface Service {
  name: string
  namespace: string
  type: string
  clusterIP: string
  ports: string
  age: string
}

const columns: ColumnDef<Service>[] = [
  { header: 'Name', cell: (item) => item.name, className: 'w-[200px]' },
  {
    header: 'Namespace',
    cell: (item) => item.namespace,
    className: 'w-[150px]',
  },
  { header: 'Type', cell: (item) => item.type, className: 'w-[100px]' },
  {
    header: 'Cluster IP',
    cell: (item) => item.clusterIP,
    className: 'w-[120px]',
  },
  { header: 'Ports', cell: (item) => item.ports, className: 'w-[250px]' },
  { header: 'Age', cell: (item) => item.age, className: 'w-[150px]' },
]

export function ServicesTable() {
  return (
    <ResourceTable<Service>
      resource="services"
      columns={columns}
      rowKey={(item) => `${item.namespace}-${item.name}`}
      linkGenerator={(item) => `/services/${item.namespace}/${item.name}`}
    />
  )
}
