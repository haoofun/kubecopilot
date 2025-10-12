import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { V1Pod, V1ContainerState } from '@kubernetes/client-node'
import { Badge } from '@/components/ui/badge'

interface PodContainersCardProps {
  pod: V1Pod | undefined
}

// 辅助函数，根据容器状态返回不同的 Badge 样式
function getStatusBadge(state: V1ContainerState | undefined): React.ReactNode {
  if (state?.running) {
    return <Badge variant="default">Running</Badge>
  }
  if (state?.waiting) {
    return (
      <Badge variant="secondary">{state.waiting.reason || 'Waiting'}</Badge>
    )
  }
  if (state?.terminated) {
    return (
      <Badge variant="destructive">
        {state.terminated.reason || 'Terminated'}
      </Badge>
    )
  }
  return <Badge variant="outline">Unknown</Badge>
}

export function PodContainersCard({ pod }: PodContainersCardProps) {
  const containerStatuses = pod?.status?.containerStatuses || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Containers</CardTitle>
      </CardHeader>
      <CardContent>
        {containerStatuses.length > 0 ? (
          <div className="space-y-4">
            {containerStatuses.map((status) => (
              <div
                key={status.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-semibold">{status.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Image: {status.image}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(status.state)}
                  <p className="text-muted-foreground mt-1 text-xs">
                    Restarts: {status.restartCount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No container statuses available.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
