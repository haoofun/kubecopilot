// lib/k8s/types/pod.ts
import { OwnerReference, Condition } from './common'

/**
 * Captures the origin of an environment variable so the observability board can indicate whether a value originated from a Secret,
 * ConfigMap, or Downward API reference; in Kubernetes this mirrors the `valueFrom` object on a container env entry.
 */
export interface PodEnvVarSource {
  [key: string]: unknown
}

/**
 * Represents one environment variable exposed in a pod container, letting the board show configuration drift pulled straight from `Pod.spec.containers[].env`.
 */
export interface PodEnvVar {
  /** Name lets SREs align env vars with service configs; it maps to `env[].name` in the pod spec. */
  name: string
  /** The literal value is surfaced for fast debugging when policies allow it; it is `env[].value` in Kubernetes. */
  value?: string
  /** When secrets or config maps source the value, this block is the `env[].valueFrom` structure from Kubernetes. */
  valueFrom?: PodEnvVarSource
}

/**
 * Describes per-container resource guarantees so the board can visualize CPU/memory requests versus limits directly from `resources`.
 */
export interface PodContainerResources {
  /** Observability charts use request values to estimate guaranteed floor; this maps to `resources.requests.cpu|memory`. */
  requests: Partial<Record<'cpu' | 'memory', string>>
  /** Limit values define the ceiling SREs compare against throttling alerts; sourced from `resources.limits`. */
  limits: Partial<Record<'cpu' | 'memory', string>>
}

/**
 * Aggregated resource totals per pod that the board uses to render stacked charts derived from Kubernetes usage data.
 */
export interface AggregatedResourceValues {
  /** Total CPU requests/limits for the pod as millicores, mirroring Kubernetes resource quantity strings. */
  cpu?: string
  /** Total memory requests/limits for the pod, again matching Kubernetes quantity syntax like `128Mi`. */
  memory?: string
}

/**
 * Bundles aggregated requests and limits so the UI can render side-by-side bars for pod-level consumption.
 */
export interface PodAggregatedResources {
  /** Request totals feed capacity planning widgets and originate from summing `spec.containers[].resources.requests`. */
  requests: AggregatedResourceValues
  /** Limit totals show headroom and come from `resources.limits` across containers. */
  limits: AggregatedResourceValues
}

/**
 * Snapshot of a container's previous state so the observability board can surface recent crashes; it mirrors `lastState`.
 */
export interface PodContainerLastState {
  /** Phase conveys whether the prior state was Waiting or Terminated, mirroring `containerStatuses[].lastState`. */
  phase: 'Waiting' | 'Terminated'
  /** Reason explains why the container left that state; Kubernetes emits strings such as `CrashLoopBackOff`. */
  reason?: string
  /** Message offers human-readable context straight from Kubernetes status, used for timeline tooltips. */
  message?: string
  /** finishedAt timestamps crashes so the board can align them with cluster events; it maps to `lastState.terminated.finishedAt`. */
  finishedAt?: string
}

/**
 * Rich container summary that powers the pod details drawer in the dashboard, derived from `spec.containers` and `status.containerStatuses`.
 */
export interface PodContainer {
  /** Container name helps match telemetry to workloads; it equals `spec.containers[].name`. */
  name: string
  /** image lets operators confirm rollouts and matches the `image` field in the pod spec. */
  image: string
  /** status is a synthesized status from Kubernetes container states so the board can show `Running`, `Waiting`, etc. */
  status?: string
  /** restarts counts cumulative restarts, mapping to `status.containerStatuses[].restartCount`. */
  restarts: number
  /** ports lists exposed container ports so network dashboards can cross reference `containerPort` definitions. */
  ports: { name?: string; containerPort: number; protocol: string }[]
  /** env exposes each environment variable to explain configuration coming directly from `spec.containers[].env`. */
  env: PodEnvVar[]
  /** volumeMounts show where data is persisted or injected, reflecting `volumeMounts` in the pod spec. */
  volumeMounts: { name: string; mountPath: string; readOnly?: boolean }[]
  /** resources surfaces request/limit contracts so container rows can display CPU/memory budgets straight from Kubernetes. */
  resources: PodContainerResources
  /** lastState surfaces crash diagnostics sourced from `status.containerStatuses[].lastState`. */
  lastState?: PodContainerLastState
}

/** Simplified toleration view so inspectors can render scheduling rules without exposing the entire Kubernetes schema. */
export interface PodToleration {
  key?: string
  operator?: string
  value?: string
  effect?: string
  tolerationSeconds?: number
}

/**
 * Simplified volume descriptor so the observability board can link pods to ConfigMaps, Secrets, or PVCs via `spec.volumes`.
 */
export interface PodVolume {
  /** Name ties the volume back to `spec.volumes[].name`, letting UI highlight mounts per container. */
  name: string
  /** Type indicates what backs the volume (ConfigMap, Secret, PVC) using the key present on the Kubernetes volume definition. */
  type: string // e.g., 'ConfigMap', 'Secret', 'PersistentVolumeClaim'
}

/**
 * Light-weight pod row shown in namespace listings that combines identity, placement, and health data pulled from Kubernetes.
 */
export interface PodSummary {
  /** Observability deduplicates pods via UID, mirroring `metadata.uid`. */
  uid: string
  /** Pod name is shown verbatim from `metadata.name`. */
  name: string
  /** namespace scopes tenancy slices inside the dashboard and equals `metadata.namespace`. */
  namespace: string
  /** status summarizes `status.phase`, enabling quick filters like Pending/Running. */
  status: string
  /** restarts aligns with `status.containerStatuses[].restartCount` to reveal instability. */
  restarts: number
  /** resources holds aggregated request/limit data derived from the pod spec for capacity charts. */
  resources: PodAggregatedResources
  /** nodeName shows placement for workload spreading analysis, mapping to `spec.nodeName`. */
  nodeName: string | null
  /** creationTimestamp feeds lifecycle charts and equals `metadata.creationTimestamp`. */
  creationTimestamp: string
  /** ip surfaces the pod IP so service mesh traces can correlate, mirroring `status.podIP`. */
  ip: string
  /** owner references the controller from `metadata.ownerReferences` so the board can group pods by workload. */
  owner: OwnerReference | null
}

/**
 * Full pod detail that extends the summary with labels, annotations, containers, volumes, and conditions as returned by Kubernetes.
 */
export interface PodDetail extends PodSummary {
  /** labels expose scheduling metadata like app/version straight from `metadata.labels`. */
  labels: Record<string, string>
  /** annotations include SLO hints or deployment info from `metadata.annotations`. */
  annotations: Record<string, string>
  /** owner duplicates the summary field for clarity when drilling down. */
  owner: OwnerReference | null
  /** containers contains the full container breakdown derived from the pod spec and status arrays. */
  containers: PodContainer[]
  /** initContainers lists bootstrap tasks from `spec.initContainers`, matching the container schema above. */
  initContainers: PodContainer[]
  /** volumes ties pods back to ConfigMaps, Secrets, and PVCs pulled from `spec.volumes`. */
  volumes: PodVolume[]
  /** conditions represent `status.conditions`, which drive badge states and readiness indicators on the board. */
  conditions: Condition[]
  /** serviceAccountName relays the identity used by the pod (`spec.serviceAccountName`). */
  serviceAccountName?: string
  /** priorityClassName surfaces scheduling priority from `spec.priorityClassName`. */
  priorityClassName?: string
  /** nodeSelector mirrors `spec.nodeSelector` for quick inspection. */
  nodeSelector: Record<string, string>
  /** tolerations list scheduling tolerations derived from `spec.tolerations`. */
  tolerations: PodToleration[]
  /** imagePullSecrets lists secret names used for pulling images. */
  imagePullSecrets: string[]
  /** dnsPolicy is passed through from `spec.dnsPolicy`. */
  dnsPolicy?: string
  /** hostNetwork/hostPID/hostIPC mirror the pod spec booleans for host namespace usage. */
  hostNetwork?: boolean
  hostPID?: boolean
  hostIPC?: boolean
  /** qosClass, podIPs, hostIP, startTime, and phase summarize runtime status fields. */
  qosClass?: string
  podIPs: string[]
  hostIP?: string
  startTime?: string
  phase?: string
}
