import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Terminal } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ResourceRefreshButton } from './ResourceRefreshButton'
import type { DetailResponse } from '@/lib/k8s/types/common'

type BreadcrumbEntry = { label: string; href: string }

type ResourceError = {
  message: string
  statusCode?: number
  code?: string
}

interface ResourceDetailPageProps<TSummary, TRaw> {
  resourceBase: string
  name: string
  namespace?: string
  detail: DetailResponse<TSummary, TRaw> | null
  error?: ResourceError | null
  InfoCardComponent: React.ComponentType<{ summary: TSummary }>
  breadcrumbs?: BreadcrumbEntry[]
  showRefreshButton?: boolean
  children: (detail: DetailResponse<TSummary, TRaw>) => React.ReactNode
}

const renderBreadcrumbs = (
  breadcrumbs: BreadcrumbEntry[] | undefined,
  name: string,
) => {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={crumb.href}>{crumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function ResourceDetailPage<TSummary, TRaw>({
  resourceBase,
  name,
  namespace,
  detail,
  error,
  InfoCardComponent,
  breadcrumbs,
  showRefreshButton = true,
  children,
}: ResourceDetailPageProps<TSummary, TRaw>) {
  const breadcrumbMarkup = renderBreadcrumbs(breadcrumbs, name)
  const backHref =
    breadcrumbs?.[breadcrumbs.length - 1]?.href || `/${resourceBase}`

  if (error || !detail) {
    const message =
      error?.message ||
      `The requested ${resourceBase} "${name}"${namespace ? ` in namespace "${namespace}"` : ''} could not be found.`

    return (
      <div className="space-y-4">
        {breadcrumbMarkup}
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{error ? 'Error' : 'Not Found'}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
          <div className="mt-4 flex gap-2">
            <ResourceRefreshButton>Retry</ResourceRefreshButton>
            <Button variant="ghost" size="sm" asChild>
              <Link href={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  const summary = detail.summary

  return (
    <div className="min-w-0 space-y-6">
      {breadcrumbMarkup}
      {showRefreshButton ? (
        <div className="flex justify-end">
          <ResourceRefreshButton />
        </div>
      ) : null}
      <InfoCardComponent summary={summary} />
      {children(detail)}
    </div>
  )
}
