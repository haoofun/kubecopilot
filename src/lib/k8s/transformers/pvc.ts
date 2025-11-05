import type { V1PersistentVolumeClaim } from '@kubernetes/client-node'

import type { PVCSummary, PVCDetail } from '../types/pvc'

const formatCapacity = (pvc: V1PersistentVolumeClaim): string | undefined => {
  const storage = pvc.status?.capacity?.storage
  return storage ? String(storage) : undefined
}

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

export const transformPVCToSummary = (
  pvc: V1PersistentVolumeClaim,
): PVCSummary => baseSummary(pvc)

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
