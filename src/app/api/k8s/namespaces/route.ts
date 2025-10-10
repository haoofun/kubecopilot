import { NextResponse, NextRequest } from 'next/server'
import { getK8sCoreV1Api } from '@/lib/k8s/client'
import { V1Namespace } from '@kubernetes/client-node'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('k8s-session-id')?.value
    const k8sApi = getK8sCoreV1Api(sessionId)

    const response = await k8sApi.listNamespace()
    const namespaces = response.items

    const formattedNamespaces = namespaces.map((ns: V1Namespace) => ({
      name: ns.metadata?.name || 'N/A',
      status: ns.status?.phase || 'N/A',
      creationTimestamp: ns.metadata?.creationTimestamp,
    }))

    return NextResponse.json(formattedNamespaces)
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    console.error(`[NAMESPACES API ERROR] ${errorMessage}`)
    return NextResponse.json(
      { message: 'Failed to fetch namespaces.', error: errorMessage },
      { status: 401 },
    )
  }
}
