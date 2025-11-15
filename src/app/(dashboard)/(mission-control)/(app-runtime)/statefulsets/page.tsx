import React from 'react'

import { StatefulSetsTable } from '@/components/k8s/statefulsets/StatefulSetsTable'
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
  { label: 'StatefulSets', href: '/statefulsets' },
]

export default function StatefulSetsPage() {
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
      <h1 className="mb-4 text-2xl font-bold">StatefulSets</h1>
      <div className="rounded-lg border">
        <StatefulSetsTable />
      </div>
    </div>
  )
}
