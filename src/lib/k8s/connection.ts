import { KubeConfig, CoreV1Api } from '@kubernetes/client-node'

import { createSession } from '@/lib/session'

export async function validateKubeconfig(kubeconfig: string): Promise<void> {
  const kc = new KubeConfig()
  kc.loadFromString(kubeconfig)

  const api = kc.makeApiClient(CoreV1Api)
  await api.listNamespace()
}

export async function establishKubernetesSession(
  kubeconfig: string,
): Promise<string> {
  await validateKubeconfig(kubeconfig)
  return await createSession(kubeconfig)
}
