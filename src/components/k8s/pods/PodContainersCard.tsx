'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { PodDetail } from '@/lib/k8s/types/pod'

interface PodContainersCardProps {
  pod: PodDetail
}

export function PodContainersCard({ pod }: PodContainersCardProps) {
  const containers = pod.containers
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const formatTimestamp = (value?: string) => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }
    return isHydrated ? parsed.toLocaleString() : parsed.toISOString()
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Containers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Restarts</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Last State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {containers.map((container) => (
              <TableRow key={container.name}>
                <TableCell>{container.name}</TableCell>
                <TableCell>{container.image}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      container.status === 'Running'
                        ? 'secondary'
                        : container.status === 'Terminated'
                          ? 'destructive'
                          : 'outline'
                    }
                  >
                    {container.status ?? 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>{container.restarts}</TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-pre-wrap">
                  CPU {container.resources.requests.cpu ?? '—'} · Memory{' '}
                  {container.resources.requests.memory ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-pre-wrap">
                  CPU {container.resources.limits.cpu ?? '—'} · Memory{' '}
                  {container.resources.limits.memory ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {container.lastState ? (
                    <div className="space-y-1">
                      <div>
                        {container.lastState.phase}
                        {container.lastState.reason
                          ? ` · ${container.lastState.reason}`
                          : ''}
                        {container.lastState.message ? (
                          <span className="text-muted-foreground/80 block text-[11px]">
                            {container.lastState.message}
                          </span>
                        ) : null}
                      </div>
                      {container.lastState.finishedAt ? (
                        <div className="text-muted-foreground/80 text-[11px]">
                          {formatTimestamp(container.lastState.finishedAt)}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
