export interface SecretSummary {
  uid: string
  name: string
  namespace: string
  type: string
  dataCount: number
  creationTimestamp: string
}

export interface SecretDetail extends SecretSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  data: Record<string, string>
  binaryData: Record<string, string>
}
