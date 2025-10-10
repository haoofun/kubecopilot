import { NextResponse, NextRequest } from 'next/server'
import { KubeConfig, CoreV1Api } from '@kubernetes/client-node'
import { sessionStore } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const kubeconfigString = body.kubeconfig

    if (!kubeconfigString) {
      return NextResponse.json(
        { message: 'Kubeconfig is required.' },
        { status: 400 },
      )
    }

    const kc = new KubeConfig()
    kc.loadFromString(kubeconfigString)
    const k8sApi = kc.makeApiClient(CoreV1Api)
    await k8sApi.listNamespace()

    const sessionId = crypto.randomUUID()
    sessionStore.set(sessionId, kubeconfigString)

    console.log(
      `[CONNECT API] Session created successfully. Session ID: ${sessionId}. Store size: ${sessionStore.size}`,
    )

    const response = NextResponse.json({ message: 'Connection successful.' })
    response.cookies.set('k8s-session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })

    return response
  } catch (error: unknown) {
    console.error('[CONNECT API ERROR]', error)
    let errorMessage = 'An unknown error occurred.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json(
      { message: 'Failed to connect.', error: errorMessage },
      { status: 400 },
    )
  }
}
