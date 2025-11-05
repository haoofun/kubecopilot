'use client'

import React, { useState } from 'react'

import { GlobalEventsTable } from '@/components/k8s/events/GlobalEventsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
]

const initialFilters = {
  namespace: '',
  kind: '',
  name: '',
  uid: '',
}

export default function EventsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApplied(filters)
  }

  const handleClear = () => {
    setFilters(initialFilters)
    setApplied(initialFilters)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

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
      <h1 className="mb-4 text-2xl font-bold">Cluster Events</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
            <Input
              name="namespace"
              value={filters.namespace}
              onChange={handleChange}
              placeholder="Namespace"
            />
            <Input
              name="kind"
              value={filters.kind}
              onChange={handleChange}
              placeholder="Kind (e.g. Pod)"
            />
            <Input
              name="name"
              value={filters.name}
              onChange={handleChange}
              placeholder="Resource name"
            />
            <Input
              name="uid"
              value={filters.uid}
              onChange={handleChange}
              placeholder="Resource UID"
            />
            <div className="flex gap-2 md:col-span-4">
              <Button type="submit">Apply</Button>
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <GlobalEventsTable
        namespace={applied.namespace || undefined}
        kind={applied.kind || undefined}
        name={applied.name || undefined}
        uid={applied.uid || undefined}
      />
    </div>
  )
}
