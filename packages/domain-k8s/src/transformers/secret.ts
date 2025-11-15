import type { V1Secret } from '@kubernetes/client-node'

import type { SecretDetail, SecretSummary } from '../types/secret'

/** Creates a SecretSummary so the observability board can count credential objects per namespace. */
export const transformSecretToSummary = (secret: V1Secret): SecretSummary => ({
  uid: secret.metadata?.uid ?? '',
  name: secret.metadata?.name ?? '',
  namespace: secret.metadata?.namespace ?? '',
  type: secret.type ?? 'Opaque',
  dataCount: Object.keys(secret.data ?? {}).length,
  creationTimestamp: secret.metadata?.creationTimestamp?.toISOString() ?? '',
})

/**
 * Produces a SecretDetail while preserving encoded values so upper layers never receive plaintext secrets.
 */
export const transformSecretToDetail = (secret: V1Secret): SecretDetail => {
  const summary = transformSecretToSummary(secret)

  const encodedData: Record<string, string> = {}
  Object.entries(secret.data ?? {}).forEach(([key, value]) => {
    encodedData[key] =
      typeof value === 'string' ? value : Buffer.from(value).toString('base64')
  })

  const binaryData =
    (secret as { binaryData?: Record<string, string> }).binaryData ?? {}

  return {
    ...summary,
    labels: secret.metadata?.labels ?? {},
    annotations: secret.metadata?.annotations ?? {},
    data: encodedData,
    binaryData,
  }
}
