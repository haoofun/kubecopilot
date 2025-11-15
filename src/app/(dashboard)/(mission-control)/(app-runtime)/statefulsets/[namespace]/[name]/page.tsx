import { StatefulSetInfoCard } from '@/components/k8s/statefulsets/StatefulSetInfoCard'
import { EventsTable } from '@/components/k8s/shared/EventsTable'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { ResourceDetailPage } from '@/components/k8s/shared/ResourceDetailPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui-kit/tabs'
import { parseK8sError } from '@infra-http/error'
import { getStatefulSetDetail } from '@domain-k8s/services/statefulset.service'
import { notFound, redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ name: string; namespace: string }>
}

export default async function Page({ params }: PageProps) {
  const { name, namespace } = await params

  let detail: Awaited<ReturnType<typeof getStatefulSetDetail>> | null = null
  let error: ReturnType<typeof parseK8sError> | null = null

  try {
    detail = await getStatefulSetDetail(namespace, name, {
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
      resourceBase="statefulsets"
      name={name}
      namespace={namespace}
      detail={detail}
      error={error}
      InfoCardComponent={StatefulSetInfoCard}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'StatefulSets', href: '/statefulsets' },
        { label: namespace, href: `/statefulsets?namespace=${namespace}` },
      ]}
    >
      {(detail) => (
        <div className="space-y-6">
          <Tabs defaultValue="events" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
            </TabsList>
            <TabsContent value="events" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <EventsTable
                  resourceBase="statefulsets"
                  namespace={namespace}
                  name={name}
                  uid={detail.summary.uid}
                  kind="StatefulSet"
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
