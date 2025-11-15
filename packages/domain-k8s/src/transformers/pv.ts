import type { V1PersistentVolume } from '@kubernetes/client-node'

import type { PVSummary, PVDetail } from '../types/pv'

/** Formats PV capacity so the observability board can show provisioned size straight from Kubernetes spec. */
const formatCapacity = (pv: V1PersistentVolume): string | undefined => {
  const storage = pv.spec?.capacity?.storage
  return storage ? String(storage) : undefined
}

/** Builds the common PV summary fields shared by list and detail views. */
const baseSummary = (pv: V1PersistentVolume): PVSummary => ({
  uid: pv.metadata?.uid ?? '',
  name: pv.metadata?.name ?? '',
  storageClass: pv.spec?.storageClassName ?? undefined,
  capacity: formatCapacity(pv),
  status: pv.status?.phase ?? undefined,
  creationTimestamp: pv.metadata?.creationTimestamp?.toISOString() ?? '',
})

/** Produces the PVSummary used in storage inventory tables. */
export const transformPVToSummary = (pv: V1PersistentVolume): PVSummary =>
  baseSummary(pv)

/** Extends the PV summary with metadata required for storage drill-down cards on the board. */
export const transformPVToDetail = (pv: V1PersistentVolume): PVDetail => ({
  ...baseSummary(pv),
  accessModes: pv.spec?.accessModes ?? [],
  reclaimPolicy: pv.spec?.persistentVolumeReclaimPolicy ?? undefined,
  volumeMode: pv.spec?.volumeMode ?? undefined,
  claimRef: pv.spec?.claimRef ?? undefined,
  labels: pv.metadata?.labels ?? {},
  annotations: pv.metadata?.annotations ?? {},
})
