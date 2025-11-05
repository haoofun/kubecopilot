'use client'

import { useEffect, useMemo, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useK8sResourceList } from '@/hooks/useK8sResource'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { QueryParams } from '@/lib/k8s/types/common'
import type { K8sEvent } from '@/lib/k8s/types/event'

interface EventsTableProps {
  resourceBase: string
  name: string
  namespace?: string
  uid?: string
  eventNamespace?: string
  title?: string
  params?: QueryParams
  kind?: string
}

export function EventsTable({
  resourceBase,
  name,
  namespace,
  uid,
  eventNamespace,
  title = 'Events',
  params,
  kind,
}: EventsTableProps) {
  const eventsPath = useMemo(() => {
    if (namespace) {
      return `${resourceBase}/${namespace}/${name}/events`
    }
    return `${resourceBase}/${name}/events`
  }, [resourceBase, namespace, name])

  const queryParams = useMemo<QueryParams>(() => {
    const baseParams: QueryParams = {
      uid,
      name,
      ...(params ?? {}),
    }

    if (eventNamespace) {
      baseParams.namespace = eventNamespace
    }

    if (kind) {
      baseParams.kind = kind
    }

    return baseParams
  }, [uid, name, params, eventNamespace, kind])

  const { data, isLoading, isError, error } = useK8sResourceList<K8sEvent>({
    resourceBase: eventsPath,
    params: queryParams,
    enabled: Boolean(uid ?? name),
  })

  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error?.message || 'Failed to load events.'}
        </AlertDescription>
      </Alert>
    )
  }

  const events = data?.items ?? []

  const formatLastSeen = (value?: string) => {
    if (!value) return '—'
    if (!isHydrated) {
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
    }
    return formatRelativeTime(value, { addSuffix: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  Loading events...
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  No events found.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.uid}>
                  <TableCell className="break-words break-all whitespace-normal">
                    {event.type}
                  </TableCell>
                  <TableCell className="break-words break-all whitespace-normal">
                    {event.reason}
                  </TableCell>
                  <TableCell className="text-sm break-words break-all whitespace-pre-wrap">
                    {event.message}
                  </TableCell>
                  <TableCell>{event.count}</TableCell>
                  <TableCell>{formatLastSeen(event.lastTimestamp)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
