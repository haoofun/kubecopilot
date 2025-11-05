'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ServiceDetail } from '@/lib/k8s/types/service'

interface ServiceEndpointsCardProps {
  summary: ServiceDetail
}

export function ServiceEndpointsCard({ summary }: ServiceEndpointsCardProps) {
  const endpoints = summary.endpoints ?? []

  if (endpoints.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No endpoints discovered for this Service.
        </CardContent>
      </Card>
    )
  }

  const ready = endpoints.filter((endpoint) => endpoint.ready).length

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Endpoints</CardTitle>
          <p className="text-muted-foreground text-xs">
            Ready {ready} / {endpoints.length}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Node</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((endpoint, index) => (
              <TableRow key={`${endpoint.ip}-${endpoint.target?.uid ?? index}`}>
                <TableCell>
                  <Badge variant={endpoint.ready ? 'secondary' : 'destructive'}>
                    {endpoint.ready ? 'Ready' : 'Not Ready'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {endpoint.ip || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {endpoint.nodeName ?? '—'}
                </TableCell>
                <TableCell className="text-xs">
                  {endpoint.target
                    ? `${endpoint.target.kind}/${endpoint.target.name}`
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
