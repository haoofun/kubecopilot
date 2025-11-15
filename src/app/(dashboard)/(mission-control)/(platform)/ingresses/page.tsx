import React from 'react'

import { IngressesTable } from '@/components/k8s/ingresses/IngressesTable'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@ui-kit/breadcrumb'

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Ingresses', href: '/ingresses' },
]

export default function IngressesPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {index < breadcrumbs.length - 1 ? (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="mb-4 text-2xl font-bold">Ingresses</h1>
      <div className="rounded-lg border">
        <IngressesTable />
      </div>
    </div>
  )
}
