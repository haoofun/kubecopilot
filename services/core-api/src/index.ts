// Core API stub: demonstrates how the future service can reuse domain packages
// without depending on Next.js or UI concerns.
import { listNamespaces } from '@domain-k8s/services/namespace.service'

export async function bootstrapCoreApiProbe() {
  // In production this function would expose HTTP handlers.
  // For now we simply ensure the domain package is consumable.
  return listNamespaces({ params: { limit: 5 } })
}
