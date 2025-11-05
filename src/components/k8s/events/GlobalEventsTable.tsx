'use client'

import useSWR from 'swr'

import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatRelativeTime } from '@/lib/formatters/time'
import type { K8sEvent } from '@/lib/k8s/types/event'
import type { ListResponse } from '@/lib/k8s/types/common'

interface GlobalEventsTableProps {
  namespace?: string
  kind?: string
  name?: string
  uid?: string
}

const fetchEvents = async (url: string) => {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/connect'
      }
    }

    let errMsg = `HTTP ${res.status}: ${res.statusText}`
    try {
      const errData = await res.json()
      const apiError = errData?.error
      errMsg = apiError?.message ?? errData?.message ?? errMsg
    } catch {
      // ignore JSON parse failures
    }

    throw new Error(errMsg)
  }

  return res.json()
}

export function GlobalEventsTable({
  namespace,
  kind,
  name,
  uid,
}: GlobalEventsTableProps) {
  const params = new URLSearchParams()
  if (namespace) params.set('namespace', namespace)
  if (kind) params.set('kind', kind)
  if (name) params.set('name', name)
  if (uid) params.set('uid', uid)

  const query = params.toString()
  const { data, error, isLoading } = useSWR<ListResponse<K8sEvent>>(
    `/api/k8s/events${query ? `?${query}` : ''}`,
    fetchEvents,
  )

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  const events = data?.items ?? []

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Object</th>
                <th className="px-4 py-2">Namespace</th>
                <th className="px-4 py-2">Count</th>
                <th className="px-4 py-2">Age</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-4 py-6 text-center"
                  >
                    Loading events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-4 py-6 text-center"
                  >
                    No events found.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.uid} className="border-b last:border-0">
                    <td className="px-4 py-2 font-semibold">{event.type}</td>
                    <td className="px-4 py-2">{event.reason}</td>
                    <td className="px-4 py-2">{event.message}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {event.involvedObject?.kind}/{event.involvedObject?.name}
                    </td>
                    <td className="px-4 py-2">
                      {event.involvedObject?.namespace || '—'}
                    </td>
                    <td className="px-4 py-2">{event.count}</td>
                    <td className="px-4 py-2">
                      {formatRelativeTime(event.lastTimestamp, {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
