import { DeploymentInfoCard } from '@/components/k8s/deployments/DeploymentInfoCard'
import { DeploymentPodsCard } from '@/components/k8s/deployments/DeploymentPodsCard'
import { EventsTable } from '@/components/k8s/shared/EventsTable'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { ResourceDetailPage } from '@/components/k8s/shared/ResourceDetailPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseK8sError } from '@/lib/api/error'
import { getDeploymentDetail } from '@/lib/k8s/services/deployment.service'
import { notFound, redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ name: string; namespace: string }>
}

export default async function Page({ params }: PageProps) {
  const { name, namespace } = await params

  let detail: Awaited<ReturnType<typeof getDeploymentDetail>> | null = null
  let error: ReturnType<typeof parseK8sError> | null = null

  try {
    detail = await getDeploymentDetail(namespace, name, {
      includePods: true,
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
      resourceBase="deployments"
      name={name}
      namespace={namespace}
      detail={detail}
      error={error}
      InfoCardComponent={DeploymentInfoCard}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Deployments', href: '/deployments' },
        { label: namespace, href: `/deployments?namespace=${namespace}` },
      ]}
    >
      {(detail) => (
        <div className="space-y-6">
          <Tabs defaultValue="pods" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="pods">Pods</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
            </TabsList>
            <TabsContent value="pods" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <DeploymentPodsCard summary={detail.summary} />
              </div>
            </TabsContent>
            <TabsContent value="events" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <EventsTable
                  resourceBase="deployments"
                  namespace={namespace}
                  name={name}
                  uid={detail.summary.uid}
                  kind="Deployment"
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
