import { KubeConfig, CoreV1Api } from '@kubernetes/client-node'

import { createSession } from '@/lib/session'

/**
 * Validates an uploaded kubeconfig so the observability board only ingests credentials that can successfully read cluster state.
 */
export async function validateKubeconfig(kubeconfig: string): Promise<void> {
  const kc = new KubeConfig()
  kc.loadFromString(kubeconfig)

  const api = kc.makeApiClient(CoreV1Api)
  await api.listNamespace()
}

/**
 * Persists a verified kubeconfig into the session store, enabling the board to personalize cluster views per user.
 */
export async function establishKubernetesSession(
  kubeconfig: string,
): Promise<string> {
  await validateKubeconfig(kubeconfig)
  return await createSession(kubeconfig)
}
