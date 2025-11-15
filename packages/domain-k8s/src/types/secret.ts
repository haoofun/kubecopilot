/**
 * Light summary of a Secret so the observability board can count sensitive assets per namespace using Kubernetes metadata.
 */
export interface SecretSummary {
  /** UID uniquely tracks the Secret, mirroring `metadata.uid`. */
  uid: string
  /** name is surfaced from `metadata.name` for operators to recognize credentials. */
  name: string
  /** namespace shows tenancy scope, taken from `metadata.namespace`. */
  namespace: string
  /** type communicates the Secret format (Opaque, kubernetes.io/dockerconfigjson) derived from `type`. */
  type: string
  /** dataCount counts keys stored in `data`, giving a quick size estimate for the board. */
  dataCount: number
  /** creationTimestamp indicates when the Secret was first created, mirroring `metadata.creationTimestamp`. */
  creationTimestamp: string
}

/**
 * Full Secret details letting the board show labels, annotations, and key names without leaking values.
 */
export interface SecretDetail extends SecretSummary {
  /** labels (from `metadata.labels`) let SREs filter Secrets by owner/reason. */
  labels: Record<string, string>
  /** annotations capture rotation metadata from `metadata.annotations`. */
  annotations: Record<string, string>
  /** data stores base64 values from `data`; the board may redact values but lists keys for audit. */
  data: Record<string, string>
  /** binaryData mirrors the `binaryData` map for raw payloads, letting ops know when non-UTF8 content exists. */
  binaryData: Record<string, string>
}
