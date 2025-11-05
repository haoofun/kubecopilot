export interface ConfigMapSummary {
  uid: string
  name: string
  namespace: string
  dataCount: number
  creationTimestamp: string
}

export interface ConfigMapDetail extends ConfigMapSummary {
  labels: Record<string, string>
  annotations: Record<string, string>
  data: Record<string, string>
  binaryData: Record<string, string>
}
