import type { V1PersistentVolume } from '@kubernetes/client-node'

import type { PVSummary, PVDetail } from '../types/pv'

const formatCapacity = (pv: V1PersistentVolume): string | undefined => {
  const storage = pv.spec?.capacity?.storage
  return storage ? String(storage) : undefined
}

const baseSummary = (pv: V1PersistentVolume): PVSummary => ({
  uid: pv.metadata?.uid ?? '',
  name: pv.metadata?.name ?? '',
  storageClass: pv.spec?.storageClassName ?? undefined,
  capacity: formatCapacity(pv),
  status: pv.status?.phase ?? undefined,
  creationTimestamp: pv.metadata?.creationTimestamp?.toISOString() ?? '',
})

export const transformPVToSummary = (pv: V1PersistentVolume): PVSummary =>
  baseSummary(pv)

export const transformPVToDetail = (pv: V1PersistentVolume): PVDetail => ({
  ...baseSummary(pv),
  accessModes: pv.spec?.accessModes ?? [],
  reclaimPolicy: pv.spec?.persistentVolumeReclaimPolicy ?? undefined,
  volumeMode: pv.spec?.volumeMode ?? undefined,
  claimRef: pv.spec?.claimRef ?? undefined,
  labels: pv.metadata?.labels ?? {},
  annotations: pv.metadata?.annotations ?? {},
})
