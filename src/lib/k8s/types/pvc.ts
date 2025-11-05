export interface PVCVolumeSource {
  volumeName?: string
  storageClass?: string
  accessModes: string[]
  storage?: string
}

export interface PVCStatus {
  phase?: string
  capacity?: string
}

export interface PVCDetail extends PVCVolumeSource, PVCStatus {
  uid: string
  name: string
  namespace: string
  labels: Record<string, string>
  annotations: Record<string, string>
  creationTimestamp: string
}

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
