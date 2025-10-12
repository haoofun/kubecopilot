'use client'

import { useK8sResource } from '@/hooks/useK8sResource'
import { V1Deployment, CoreV1Event } from '@kubernetes/client-node'
import { Skeleton } from '@/components/ui/skeleton'
import { EventsTable } from '@/components/k8s/EventsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReadOnlyYamlViewer } from '@/components/shared/ReadOnlyYamlViewer'
import { DeploymentInfoCard } from '@/components/k8s/DeploymentInfoCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { use } from 'react'

// --- 类型定义 ---
interface DeploymentDetailData {
  detail: V1Deployment
  events: CoreV1Event[]
  yaml: string
}
type Params = Promise<{ namespace: string; name: string }>

export default function DeploymentDetailPage({ params }: { params: Params }) {
  const { namespace, name } = use(params)
  const { data, isLoading, isError } = useK8sResource<DeploymentDetailData>(
    `deployments/${namespace}/${name}`,
  )

  if (isLoading) {
    return <DetailSkeleton /> // 使用一个通用的骨架屏
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {isError?.message || 'Failed to load11 deployment details.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deployment: {name}</h1>
        <p className="text-muted-foreground">Namespace: {namespace}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="yaml">YAML</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <DeploymentInfoCard deployment={data?.detail} />
          {/* TODO: Add a card for ReplicaSet/Pod status related to this deployment */}
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <EventsTable events={data?.events} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yaml" className="mt-4">
          <ReadOnlyYamlViewer yamlString={data?.yaml || ''} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 通用骨架屏
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
