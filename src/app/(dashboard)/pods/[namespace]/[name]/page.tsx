'use client'

import { useK8sResource } from '@/hooks/useK8sResource'
import { V1Pod, CoreV1Event } from '@kubernetes/client-node'
import { Skeleton } from '@/components/ui/skeleton'
import { PodInfoCard } from '@/components/k8s/PodInfoCard'
import { EventsTable } from '@/components/k8s/EventsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReadOnlyYamlViewer } from '@/components/shared/ReadOnlyYamlViewer'
import { PodContainersCard } from '@/components/k8s/PodContainersCard'
import { use } from 'react'

// ... (接口和类型定义保持不变)
interface PodDetailData {
  detail: V1Pod
  events: CoreV1Event[]
  yaml: string
}
type Params = Promise<{ namespace: string; name: string }>

export default function PodDetailPage({ params }: { params: Params }) {
  const { namespace, name } = use(params)
  const { data, isLoading, isError } = useK8sResource<PodDetailData>(
    `pods/${namespace}/${name}`,
  )

  if (isLoading) {
    return <PodDetailSkeleton /> // 骨架屏保持不变
  }

  if (isError) {
    return (
      <div className="p-8 text-center font-bold text-red-500">
        Failed to load pod details.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pod: {name}</h1>
        <p className="text-muted-foreground">Namespace: {namespace}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="yaml">YAML</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <PodInfoCard pod={data?.detail} />
          <PodContainersCard pod={data?.detail} />
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

function PodDetailSkeleton() {
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
          <Skeleton className="h-4 w-5/6" />
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
