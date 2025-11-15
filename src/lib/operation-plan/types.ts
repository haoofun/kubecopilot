/** Tracks the lifecycle of an AI-suggested change so SREs can audit pending vs executed plans. */
export type OperationPlanStatus =
  | 'pending'
  | 'confirmed'
  | 'executed'
  | 'failed'
  | 'reverted'

/** High-level verbs that map directly to Kubernetes operations (create/update/delete/scale/restart). */
export type OperationPlanAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'scale'
  | 'restart'

export type OperationPlanRiskLevel = 'low' | 'medium' | 'high'

/** Minimal JSON Patch entry describing how a Kubernetes manifest should change. */
export type JsonPatchOperation = {
  op: 'add' | 'remove' | 'replace'
  path: string
  value?: unknown
}

/** Each step in a plan spells out the action, human-readable description, and optional (rollback) patches. */
export interface OperationPlanStep {
  id: string
  action: OperationPlanAction
  description: string
  patch?: JsonPatchOperation[]
  rollbackPatch?: JsonPatchOperation[]
}

/** Identifies the Kubernetes object the plan will mutate, including deep links back into the observability UI. */
export interface OperationPlanResourceRef {
  kind: string
  namespace: string
  name: string
  uid?: string
  resourceVersion?: string
  cluster?: string
  href: string
}

/** Captures before/diff/rollback data so reviewers understand exactly how manifests evolve. */
export interface OperationPlanDiffSnapshot {
  before: Record<string, unknown> | null
  patch: JsonPatchOperation[]
  patchFormat: 'rfc6902' | 'strategic-merge'
  rollbackPatch?: JsonPatchOperation[]
}

/** Structured risk assessment surfaced to reviewers before approving an AI-executed change. */
export interface OperationPlanRisk {
  level: OperationPlanRiskLevel
  rationale: string
  score: number | null
  factors: string[]
  sloBudgetImpact?: 'none' | 'low' | 'medium' | 'high'
  postConditions: string[]
}

/** Timestamps for each stage of the plan lifecycle for compliance tracking. */
export interface OperationPlanAuditTimestamps {
  createdAt: string
  confirmedAt: string | null
  executedAt: string | null
  failedAt: string | null
  revertedAt: string | null
}

/** Audit trail capturing who requested/confirmed/executed the plan plus idempotency metadata. */
export interface OperationPlanAudit {
  requestedBy: string
  confirmedBy: string | null
  executedBy: string
  idempotencyKey?: string
  sourcePromptId?: string
  timestamps: OperationPlanAuditTimestamps
}

/** Full operation plan record combining AI rationale, diff, risk, audit, and targeted Kubernetes resource. */
export interface OperationPlan {
  id: string
  version: string
  status: OperationPlanStatus
  action: OperationPlanAction
  intent: string
  steps: OperationPlanStep[]
  resource: OperationPlanResourceRef
  diff: OperationPlanDiffSnapshot
  risk: OperationPlanRisk
  aiRationale: string
  audit: OperationPlanAudit
}
