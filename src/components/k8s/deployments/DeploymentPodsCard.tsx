'use client'

import { Badge } from '@ui-kit/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import type { DeploymentDetail } from '@domain-k8s/types/deployment'

interface DeploymentPodsCardProps {
  summary: DeploymentDetail
}

const badgeVariant = (
  status: string | undefined,
): 'secondary' | 'outline' | 'destructive' => {
  if (!status) return 'outline'
  if (status === 'Running') return 'secondary'
  if (status === 'Pending') return 'outline'
  return 'destructive'
}

export function DeploymentPodsCard({ summary }: DeploymentPodsCardProps) {
  const pods = summary.pods ?? []

  if (pods.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Pods</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No pods currently match this Deployment selector.
        </CardContent>
      </Card>
    )
  }

  const ready = pods.filter((pod) => pod.status === 'Running').length

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Pods</CardTitle>
          <p className="text-muted-foreground text-xs">
            Ready {ready} / {pods.length}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {pods.map((pod) => (
          <div
            key={pod.uid}
            className="border-muted-foreground/20 bg-muted/20 flex flex-wrap items-start justify-between gap-3 rounded-md border px-3 py-2 text-xs"
          >
            <div className="flex flex-col gap-1">
              <span className="font-mono text-sm">{pod.name}</span>
              <span className="text-muted-foreground/80 text-[11px]">
                Node {pod.nodeName ?? '—'} · Restarts {pod.restarts}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant(pod.status)}>{pod.status}</Badge>
              {pod.ip ? (
                <span className="text-muted-foreground font-mono">
                  {pod.ip}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
