import { IngressInfoCard } from '@/components/k8s/ingresses/IngressInfoCard'
import { EventsTable } from '@/components/k8s/shared/EventsTable'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { ResourceDetailPage } from '@/components/k8s/shared/ResourceDetailPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui-kit/tabs'
import { parseK8sError } from '@infra-http/error'
import { getIngressDetail } from '@domain-k8s/services/ingress.service'
import { notFound, redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ name: string; namespace: string }>
}

export default async function Page({ params }: PageProps) {
  const { name, namespace } = await params

  let detail: Awaited<ReturnType<typeof getIngressDetail>> | null = null
  let error: ReturnType<typeof parseK8sError> | null = null

  try {
    detail = await getIngressDetail(namespace, name, {
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
      resourceBase="ingresses"
      name={name}
      namespace={namespace}
      detail={detail}
      error={error}
      InfoCardComponent={IngressInfoCard}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Ingresses', href: '/ingresses' },
        { label: namespace, href: `/ingresses?namespace=${namespace}` },
      ]}
    >
      {(detail) => (
        <div className="space-y-6">
          <Tabs defaultValue="events" className="mt-4">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
            </TabsList>
            <TabsContent value="events" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <EventsTable
                  resourceBase="ingresses"
                  namespace={namespace}
                  name={name}
                  uid={detail.summary.uid}
                  kind="Ingress"
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
