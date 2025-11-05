export interface PVClaimRef {
  namespace?: string
  name?: string
}

export interface PVDetail {
  uid: string
  name: string
  capacity?: string
  accessModes: string[]
  storageClass?: string
  reclaimPolicy?: string
  volumeMode?: string
  claimRef?: PVClaimRef
  status?: string
  labels: Record<string, string>
  annotations: Record<string, string>
  creationTimestamp: string
}

export type PVSummary = Pick<
  PVDetail,
  'uid' | 'name' | 'storageClass' | 'capacity' | 'status' | 'creationTimestamp'
>
