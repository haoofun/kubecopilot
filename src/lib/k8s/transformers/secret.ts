import type { V1Secret } from '@kubernetes/client-node'

import type { SecretDetail, SecretSummary } from '../types/secret'

export const transformSecretToSummary = (secret: V1Secret): SecretSummary => ({
  uid: secret.metadata?.uid ?? '',
  name: secret.metadata?.name ?? '',
  namespace: secret.metadata?.namespace ?? '',
  type: secret.type ?? 'Opaque',
  dataCount: Object.keys(secret.data ?? {}).length,
  creationTimestamp: secret.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformSecretToDetail = (secret: V1Secret): SecretDetail => {
  const summary = transformSecretToSummary(secret)

  const decodedData: Record<string, string> = {}
  Object.entries(secret.data ?? {}).forEach(([key, value]) => {
    decodedData[key] = Buffer.from(value, 'base64').toString('utf8')
  })

  const binaryData =
    (secret as { binaryData?: Record<string, string> }).binaryData ?? {}

  return {
    ...summary,
    labels: secret.metadata?.labels ?? {},
    annotations: secret.metadata?.annotations ?? {},
    data: decodedData,
    binaryData,
  }
}
