import type { V1PersistentVolumeClaim } from '@kubernetes/client-node'

import type { PVCSummary, PVCDetail } from '../types/pvc'

/** Extracts actual bound capacity so the board can show how much storage Kubernetes granted for the claim. */
const formatCapacity = (pvc: V1PersistentVolumeClaim): string | undefined => {
  const storage = pvc.status?.capacity?.storage
  return storage ? String(storage) : undefined
}

/** Builds the core PVC summary fields reused across list/detail components. */
const baseSummary = (pvc: V1PersistentVolumeClaim): PVCSummary => ({
  uid: pvc.metadata?.uid ?? '',
  name: pvc.metadata?.name ?? '',
  namespace: pvc.metadata?.namespace ?? '',
  storageClass: pvc.spec?.storageClassName ?? undefined,
  storage: pvc.spec?.resources?.requests?.storage
    ? String(pvc.spec?.resources?.requests?.storage)
    : undefined,
  phase: pvc.status?.phase ?? undefined,
  creationTimestamp: pvc.metadata?.creationTimestamp?.toISOString() ?? '',
})

/** Produces the PVCSummary powering namespace storage tables. */
export const transformPVCToSummary = (
  pvc: V1PersistentVolumeClaim,
): PVCSummary => baseSummary(pvc)

/** Supplies the PVCDetail for drill-down cards on the observability board. */
export const transformPVCToDetail = (
  pvc: V1PersistentVolumeClaim,
): PVCDetail => ({
  ...baseSummary(pvc),
  accessModes: pvc.spec?.accessModes ?? [],
  volumeName: pvc.spec?.volumeName ?? undefined,
  capacity: formatCapacity(pvc),
  labels: pvc.metadata?.labels ?? {},
  annotations: pvc.metadata?.annotations ?? {},
})
