'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import type { PodDetail } from '@domain-k8s/types/pod'

interface PodVolumesCardProps {
  pod: PodDetail
}

export function PodVolumesCard({ pod }: PodVolumesCardProps) {
  const volumes = pod.volumes ?? []

  if (volumes.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Volumes</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No volumes attached to this pod.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Volumes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {volumes.map((volume) => (
          <span
            key={volume.name}
            className="text-muted-foreground rounded border border-dashed px-3 py-1 font-mono text-xs"
          >
            {volume.name} ({volume.type})
          </span>
        ))}
      </CardContent>
    </Card>
  )
}
