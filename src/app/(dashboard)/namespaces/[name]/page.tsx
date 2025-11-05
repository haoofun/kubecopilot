import { NamespaceInfoCard } from '@/components/k8s/namespaces/NamespaceInfoCard'
import { NamespaceInsights } from '@/components/k8s/namespaces/NamespaceInsights'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { ResourceDetailPage } from '@/components/k8s/shared/ResourceDetailPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseK8sError } from '@/lib/api/error'
import { getNamespaceDetail } from '@/lib/k8s/services/namespace.service'
import { notFound, redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ name: string }>
}

export default async function Page({ params }: PageProps) {
  const { name } = await params

  let detail: Awaited<ReturnType<typeof getNamespaceDetail>> | null = null
  let error: ReturnType<typeof parseK8sError> | null = null

  try {
    detail = await getNamespaceDetail(name, {
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
      resourceBase="namespaces"
      name={name}
      detail={detail}
      error={error}
      InfoCardComponent={NamespaceInfoCard}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Namespaces', href: '/namespaces' },
      ]}
    >
      {(detail) => (
        <div className="space-y-6">
          <Tabs defaultValue="insights" className="mt-4">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
            </TabsList>
            <TabsContent value="insights" className="pt-4">
              <div className="h-[32rem] overflow-auto pr-1">
                <NamespaceInsights summary={detail.summary} />
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
