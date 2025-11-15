import { z } from 'zod'

/** Severity levels let the observability board highlight how urgent a Kubernetes issue is. */
export const DiagnosisSeveritySchema = z.enum([
  'info',
  'low',
  'medium',
  'high',
  'critical',
])

export const PodDiagnosisCauseSchema = z.object({
  /** title 是在 UI 中显示的根因总结，通常引用 K8s 状态或事件。 */
  title: z.string(),
  /** detail 提供更长的解释，将 Pod 状态、事件或日志上下文串联给 SRE。 */
  detail: z.string(),
  /** severity 描述该原因带来的风险级别，对应上面的枚举。 */
  severity: DiagnosisSeveritySchema.optional(),
})

export const PodDiagnosisRecommendationSchema = z.object({
  /** title 呈现建议标题，如“增加 CPU request”，与 Kubernetes 配置直接关联。 */
  title: z.string(),
  /** summary 进一步说明建议的背景。 */
  summary: z.string().optional(),
  /** steps 提示具体操作（kubectl 命令或 YAML 更改），帮助看板给出落地指南。 */
  steps: z.array(z.string()).optional(),
})

export const PodDiagnosisEvidenceSchema = z.object({
  /** label 表示证据来源（如事件、日志、字段名），映射 K8s 数据实体。 */
  label: z.string(),
  /** value 保存该证据的关键内容，通常是 Pod 字段值或事件描述。 */
  value: z.string(),
  /** context 提供额外说明，例如 K8s API 字段路径。 */
  context: z.string().optional(),
})

export const PodDiagnosisSchema = z.object({
  /** verdict 将 Pod 状态归类为 healthy/investigate/unhealthy，供看板显示彩色状态。 */
  verdict: z.enum(['healthy', 'investigate', 'unhealthy']),
  /** summary 是诊断概述，供 observability 卡片首屏显示。 */
  summary: z.string(),
  /** primary_issue 指定最主要的问题点，例如“ImagePullBackOff”。 */
  primary_issue: z.string().optional(),
  /** causes 列出所有根因条目，帮助 SRE 顺藤摸瓜。 */
  causes: z.array(PodDiagnosisCauseSchema).default([]),
  /** recommendations 给出修复建议列表，映射 Kubernetes 可执行动作。 */
  recommendations: z.array(PodDiagnosisRecommendationSchema).default([]),
  /** evidence 收集 AI 参考的 K8s 证据，便于在看板核对。 */
  evidence: z.array(PodDiagnosisEvidenceSchema).optional(),
  /** confidence 表示 AI 对诊断的把握度 (0-1)，让 SRE 判断是否需要复核。 */
  confidence: z.number().min(0).max(1).optional(),
  /** warnings 包含其他注意事项，例如“日志可能被截断”。 */
  warnings: z.array(z.string()).optional(),
})

/** PodDiagnosis 是 AI 诊断结果的 TypeScript 版本，供看板组件消费。 */
export type PodDiagnosis = z.infer<typeof PodDiagnosisSchema>
