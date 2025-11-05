import { PodContainersCard } from '@/components/k8s/pods/PodContainersCard'
import { PodVolumesCard } from '@/components/k8s/pods/PodVolumesCard'
import { PodInfoCard } from '@/components/k8s/pods/PodInfoCard'
import { PodDiagnosisPanel } from '@/components/k8s/pods/PodDiagnosisPanel'
import { EventsTable } from '@/components/k8s/shared/EventsTable'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { ResourceDetailPage } from '@/components/k8s/shared/ResourceDetailPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseK8sError } from '@/lib/api/error'
import { getPodDetail } from '@/lib/k8s/services/pod.service'
import { notFound, redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ name: string; namespace: string }>
}

export default async function Page({ params }: PageProps) {
  const { name, namespace } = await params

  let detail: Awaited<ReturnType<typeof getPodDetail>> | null = null
  let error: ReturnType<typeof parseK8sError> | null = null

  try {
    detail = await getPodDetail(namespace, name, {
      includeRaw: true,
      includeYaml: true,
    })
  } catch (err) {
    const apiError = parseK8sError(err)
    if (apiError.statusCode === 404) {
      notFound()
    }
    error = apiError
  }

  if (error?.statusCode === 401) {
    redirect('/connect')
  }

  return (
    <ResourceDetailPage
      resourceBase="pods"
      name={name}
      namespace={namespace}
      detail={detail}
      error={error}
      InfoCardComponent={PodInfoCard}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Pods', href: '/pods' },
        { label: namespace, href: `/pods?namespace=${namespace}` },
      ]}
    >
      {(detail) => (
        <div className="space-y-6">
          <PodDiagnosisPanel namespace={namespace} name={name} />
          <Tabs defaultValue="containers" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto">
              <TabsTrigger value="containers">Containers</TabsTrigger>
              <TabsTrigger value="volumes">Volumes</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
            </TabsList>
            <TabsContent value="containers" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <PodContainersCard pod={detail.summary} />
              </div>
            </TabsContent>
            <TabsContent value="volumes" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <PodVolumesCard pod={detail.summary} />
              </div>
            </TabsContent>
            <TabsContent value="events" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <EventsTable
                  resourceBase="pods"
                  namespace={namespace}
                  name={name}
                  uid={detail.summary.uid}
                  kind="Pod"
                />
              </div>
            </TabsContent>
            <TabsContent value="yaml" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <ReadOnlyYamlViewer yaml={detail.yaml} raw={detail.raw} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </ResourceDetailPage>
  )
}
