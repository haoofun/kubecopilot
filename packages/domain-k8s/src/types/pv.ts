/**
 * Reference to the claim that bound the PV so the observability board can link capacity usage back to namespaces.
 */
export interface PVClaimRef {
  /** namespace indicates which tenant owns the claim (`spec.claimRef.namespace`). */
  namespace?: string
  /** name is the PVC name from `spec.claimRef.name`, enabling drill-down. */
  name?: string
}

/**
 * Detailed PV information from `v1/PersistentVolume` resources helping SREs audit infrastructure capacity.
 */
export interface PVDetail {
  /** UID uniquely identifies the PV (from `metadata.uid`) for lifecycle tracking. */
  uid: string
  /** name equals `metadata.name`, often the cloud disk identifier displayed to operators. */
  name: string
  /** capacity shows provisioned size from `spec.capacity.storage`. */
  capacity?: string
  /** accessModes communicate how the volume can be mounted, mirroring `spec.accessModes`. */
  accessModes: string[]
  /** storageClass reveals the provisioner from `spec.storageClassName`. */
  storageClass?: string
  /** reclaimPolicy indicates whether the volume is Retain/Delete/Recycle per `spec.persistentVolumeReclaimPolicy`. */
  reclaimPolicy?: string
  /** volumeMode distinguishes Filesystem vs Block, mapping to `spec.volumeMode`. */
  volumeMode?: string
  /** claimRef identifies the bound PVC so the board can show who consumes the volume. */
  claimRef?: PVClaimRef
  /** status indicates the binding phase (Available/Bound/Released) from `status.phase`. */
  status?: string
  /** labels expose topology info (zone, type) straight from `metadata.labels`. */
  labels: Record<string, string>
  /** annotations capture CSI or cloud-provider metadata from `metadata.annotations`. */
  annotations: Record<string, string>
  /** creationTimestamp displays when the PV was provisioned, mirroring `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Lightweight PV list item containing the primary identity and capacity data from Kubernetes.
 */
export type PVSummary = Pick<
  PVDetail,
  'uid' | 'name' | 'storageClass' | 'capacity' | 'status' | 'creationTimestamp'
>
