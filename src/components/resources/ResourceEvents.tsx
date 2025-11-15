'use client'

import useSWR from 'swr'
import { useState } from 'react'

import { Alert, AlertDescription } from '@ui-kit/alert'
import { Button } from '@ui-kit/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Skeleton } from '@ui-kit/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui-kit/table'
import type { ListResponse } from '@domain-k8s/types/common'
import type { K8sEvent } from '@domain-k8s/types/event'
import { cn } from '@/lib/utils'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to load events')
  }
  return response.json()
}

export interface ResourceEventsProps {
  resourceBase: string
  namespace?: string
  name?: string
  uid?: string
  kind: string
  enabled?: boolean
}

export function ResourceEvents({
  resourceBase,
  namespace,
  name,
  uid,
  kind,
  enabled = true,
}: ResourceEventsProps) {
  const [limit, setLimit] = useState(20)

  const path = (() => {
    if (!name) return null
    const encodedName = encodeURIComponent(name)
    const encodedBase = encodeURIComponent(resourceBase)
    if (namespace) {
      const encodedNs = encodeURIComponent(namespace)
      return `/api/k8s/${encodedBase}/${encodedNs}/${encodedName}/events`
    }
    return `/api/k8s/${encodedBase}/${encodedName}/events`
  })()

  const query = path
    ? `${path}?limit=${limit}${uid ? `&uid=${encodeURIComponent(uid)}` : ''}${name ? `&name=${encodeURIComponent(name)}` : ''}`
    : null

  const { data, error, isLoading } = useSWR<ListResponse<K8sEvent>>(
    enabled && query ? query : null,
    fetcher,
    {
      keepPreviousData: true,
    },
  )

  const events = data?.items ?? []

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle>Events</CardTitle>
        <div className="text-muted-foreground text-sm">{kind}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events found.</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.uid}>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded px-2 py-1 text-xs font-semibold',
                            event.type === 'Warning'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-emerald-500/10 text-emerald-600',
                          )}
                        >
                          {event.reason}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {event.message}
                      </TableCell>
                      <TableCell>{event.count}</TableCell>
                      <TableCell className="text-sm">
                        {event.sourceComponent}
                        {event.sourceHost ? ` · ${event.sourceHost}` : ''}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(event.lastTimestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLimit((prev) => prev + 20)}
              >
                Load more
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
