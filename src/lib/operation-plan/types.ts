export type OperationPlanStatus =
  | 'pending'
  | 'confirmed'
  | 'executed'
  | 'failed'
  | 'reverted'

export type OperationPlanAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'scale'
  | 'restart'

export type OperationPlanRiskLevel = 'low' | 'medium' | 'high'

export type JsonPatchOperation = {
  op: 'add' | 'remove' | 'replace'
  path: string
  value?: unknown
}

export interface OperationPlanStep {
  id: string
  action: OperationPlanAction
  description: string
  patch?: JsonPatchOperation[]
  rollbackPatch?: JsonPatchOperation[]
}

export interface OperationPlanResourceRef {
  kind: string
  namespace: string
  name: string
  uid?: string
  resourceVersion?: string
  cluster?: string
  href: string
}

export interface OperationPlanDiffSnapshot {
  before: Record<string, unknown> | null
  patch: JsonPatchOperation[]
  patchFormat: 'rfc6902' | 'strategic-merge'
  rollbackPatch?: JsonPatchOperation[]
}

export interface OperationPlanRisk {
  level: OperationPlanRiskLevel
  rationale: string
  score: number | null
  factors: string[]
  sloBudgetImpact?: 'none' | 'low' | 'medium' | 'high'
  postConditions: string[]
}

export interface OperationPlanAuditTimestamps {
  createdAt: string
  confirmedAt: string | null
  executedAt: string | null
  failedAt: string | null
  revertedAt: string | null
}

export interface OperationPlanAudit {
  requestedBy: string
  confirmedBy: string | null
  executedBy: string
  idempotencyKey?: string
  sourcePromptId?: string
  timestamps: OperationPlanAuditTimestamps
}

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
