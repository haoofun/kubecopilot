import { KubeConfig, CoreV1Api } from '@kubernetes/client-node'
import { sessionStore } from '@/lib/session'

export function getK8sApiWithSession(
  sessionId: string | undefined | null,
): CoreV1Api {
  if (!sessionId) {
    throw new Error('Session ID is missing from cookie. Unauthorized.')
  }

  const kubeconfigString = sessionStore.get(sessionId)

  if (!kubeconfigString) {
    // 这条错误是问题的关键
    throw new Error(
      `Invalid session ID (${sessionId}) or session has expired. Session store has ${sessionStore.size} items. Unauthorized.`,
    )
  }

  const kc = new KubeConfig()
  kc.loadFromString(kubeconfigString)

  return kc.makeApiClient(CoreV1Api)
}
