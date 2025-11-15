import { z } from 'zod'

/** 看板通过模式决定 AI 对 Kubernetes YAML 是解释、优化还是生成计划。 */
export const YamlCopilotModeSchema = z.enum([
  'explain',
  'bestPractices',
  'plan',
])

/** 影响等级让 SRE 知道建议对集群的潜在风险，类似 K8s 变更的严重程度。 */
export const YamlRecommendationImpactSchema = z.enum([
  'info',
  'low',
  'medium',
  'high',
])

/** 行动类型直接映射 K8s 操作（创建/更新/扩缩容），帮助看板生成对照命令。 */
export const YamlPlanActionSchema = z.enum([
  'create',
  'update',
  'delete',
  'scale',
  'restart',
  'patch',
])

export const YamlPlanStepSchema = z.object({
  /** id 让看板在步骤列表中引用具体行动。 */
  id: z.string(),
  /** action 指明是对 Kubernetes 对象执行何种操作。 */
  action: YamlPlanActionSchema,
  /** description 为 SRE 提供人类可读的执行说明。 */
  description: z.string(),
  /** patch 包含建议的 YAML patch（符合 kubectl apply -f），便于快速复制。 */
  patch: z.string().optional(),
  /** rollbackPatch 允许在失败时复原，映射 Kubernetes 回滚思路。 */
  rollbackPatch: z.string().optional(),
})

export const YamlRecommendationSchema = z.object({
  /** id 让建议项在 UI 中可引用。 */
  id: z.string(),
  /** title 是展示在看板卡片上的一句话总结。 */
  title: z.string(),
  /** summary 解释为何需要此 YAML 变更，与 K8s 最佳实践关联。 */
  summary: z.string(),
  /** impact 告诉运维该建议对集群风险的级别。 */
  impact: YamlRecommendationImpactSchema.default('info'),
  /** path 指出 YAML 中需要关注的字段路径（如 spec.template.spec.containers[0]）。 */
  path: z.string().optional(),
})

export const YamlCopilotPlanSchema = z.object({
  /** intent 描述整体运维目标（如“提高可用性”），对应看板发起的任务。 */
  intent: z.string(),
  /** action 可提供计划的总体动作类型（create/update 等），映射 Kubernetes 执行。 */
  action: YamlPlanActionSchema.optional(),
  /** steps 是具体执行步骤列表，帮助 SRE 在集群中逐条落实。 */
  steps: z.array(YamlPlanStepSchema).default([]),
})

export const YamlCopilotResponseSchema = z.object({
  /** summary 为 AI 结论摘要，概括 YAML 问题或建议。 */
  summary: z.string(),
  /** recommendations 数组提供具体修复建议，与 Kubernetes 字段路径对应。 */
  recommendations: z.array(YamlRecommendationSchema).default([]),
  /** riskCallouts 聚焦潜在风险或警告，提示 SRE 注意集群影响。 */
  riskCallouts: z.array(z.string()).default([]),
  /** operationPlan 提供结构化执行计划，映射成 kubectl 或 GitOps 步骤。 */
  operationPlan: YamlCopilotPlanSchema.optional(),
})

/** Type-friendly alias for the copilot mode so UI components know which K8s action scope to present. */
export type YamlCopilotMode = z.infer<typeof YamlCopilotModeSchema>
/** Recommendation payload consumed by observability cards describing YAML fixes. */
export type YamlRecommendation = z.infer<typeof YamlRecommendationSchema>
/** Structured execution step that maps to kubectl commands the board may surface. */
export type YamlPlanStep = z.infer<typeof YamlPlanStepSchema>
/** Multi-step plan representation shown alongside YAML diffs. */
export type YamlCopilotPlan = z.infer<typeof YamlCopilotPlanSchema>
/** Full response shape rendered inside the YAML copilot drawer on the board. */
export type YamlCopilotResponse = z.infer<typeof YamlCopilotResponseSchema>
