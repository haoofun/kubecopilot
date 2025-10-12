'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CoreV1Event } from '@kubernetes/client-node'
import { formatDistanceToNow } from 'date-fns'

interface EventsTableProps {
  events: CoreV1Event[] | undefined
}

export function EventsTable({ events }: EventsTableProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        No events found.
      </div>
    )
  }

  // 对事件进行排序，最新的在最前面
  const sortedEvents = events.sort((a, b) => {
    const timeA = a.lastTimestamp?.getTime() || 0
    const timeB = b.lastTimestamp?.getTime() || 0
    return timeB - timeA
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedEvents.map((event, index) => (
          <TableRow key={event.metadata?.uid || index}>
            <TableCell>{event.type}</TableCell>
            <TableCell>{event.reason}</TableCell>
            <TableCell>
              {event.lastTimestamp
                ? `${formatDistanceToNow(event.lastTimestamp)} ago`
                : 'N/A'}
            </TableCell>
            <TableCell>{event.message}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
