/**
 * Details how a PVC is backed so the observability board can trace storage allocations straight from Kubernetes.
 */
export interface PVCVolumeSource {
  /** volumeName shows the bound PV from `spec.volumeName`, enabling linkage to the backing disk. */
  volumeName?: string
  /** storageClass indicates the provisioner used, mirroring `spec.storageClassName`. */
  storageClass?: string
  /** accessModes describe how pods may use the volume (ReadWriteOnce, etc.), matching `spec.accessModes`. */
  accessModes: string[]
  /** storage conveys the requested capacity from `spec.resources.requests.storage`. */
  storage?: string
}

/**
 * PVC status snapshot powering the board's storage health cards.
 */
export interface PVCStatus {
  /** phase tells whether the claim is Pending/Bound/Lost, mirroring `status.phase`. */
  phase?: string
  /** capacity exposes the actual bound size from `status.capacity.storage`. */
  capacity?: string
}

/**
 * Full PVC detail mixing spec, status, and metadata to explain storage usage per namespace.
 */
export interface PVCDetail extends PVCVolumeSource, PVCStatus {
  /** UID lets the board uniquely track the PVC, mapping to `metadata.uid`. */
  uid: string
  /** name is taken from `metadata.name` for display. */
  name: string
  /** namespace indicates tenant ownership, mirroring `metadata.namespace`. */
  namespace: string
  /** labels propagate classification metadata from `metadata.labels`. */
  labels: Record<string, string>
  /** annotations surface provisioner notes from `metadata.annotations`. */
  annotations: Record<string, string>
  /** creationTimestamp fuels lifecycle monitoring and equals `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Lightweight PVC card used in lists, containing identity plus key storage fields from Kubernetes.
 */
export type PVCSummary = Pick<
  PVCDetail,
  | 'uid'
  | 'name'
  | 'namespace'
  | 'storageClass'
  | 'storage'
  | 'phase'
  | 'creationTimestamp'
>
