import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'

const PROMPT_MANIFEST_PATH = path.join(
  process.cwd(),
  'prompts',
  'manifest.json',
)

const rolloutStageSchema = z.object({
  /** stage 命名用于看板展示 AI 提示在 K8s 运维流程的阶段（如 beta/ga）。 */
  stage: z.string().min(1),
  /** percent 让看板了解在多少集群上启用该提示，相当于 K8s rollout 百分比。 */
  percent: z.number().int().min(0).max(100),
  /** conditions 记录启用阶段需要满足的 K8s 条件（集群标签、版本等）。 */
  conditions: z.array(z.string().min(1)).default([]),
})

const promptManifestEntrySchema = z.object({
  /** id 用于看板引用特定提示，与 K8s 事件诊断面板关联。 */
  id: z.string().min(1),
  /** version 方便在不同集群间 rollout，类似 K8s manifest 版本。 */
  version: z.string().min(1),
  /** description 供看板展示提示用途，帮助 SRE 知晓生成内容与 K8s 上下文。 */
  description: z.string().min(1),
  /** templatePath 指向磁盘上的 prompt 文件，供诊断面板加载。 */
  templatePath: z.string().min(1),
  /** model 表示底层 LLM（如 gpt-4o），看板可据此标注 AI 来源。 */
  model: z.string().min(1),
  /** temperature 影响输出稳定性，确保不同集群看到一致的 K8s 诊断。 */
  temperature: z.number().min(0).max(2),
  /** maxTokens 约束响应长度，避免在看板中过载 Kubernetes 事件细节。 */
  maxTokens: z.number().int().positive(),
  /** owner 指出提示责任人，帮助运维明确谁在维护该 K8s 诊断逻辑。 */
  owner: z.string().min(1),
  /** reviewedBy 记录审阅者，确保提示满足 SRE 审核流程。 */
  reviewedBy: z.array(z.string().min(1)).min(1),
  /** lastReviewedAt 告诉看板该提示最近何时核验，与集群变更对齐。 */
  lastReviewedAt: z.string().min(1),
  /** riskTier 表示提示对 K8s 操作的风险等级，以便在 UI 中加注警示。 */
  riskTier: z.enum(['low', 'medium', 'high']),
  /** category 让看板将提示归类（如 Pod 诊断、Yaml Copilot），方便导航。 */
  category: z.string().min(1),
  /** inputSchemaRef 标注输入 schema，便于把 Kubernetes 数据正确序列化给 AI。 */
  inputSchemaRef: z.string().min(1),
  /** outputSchemaRef 告诉消费端如何解析 AI 输出至看板组件。 */
  outputSchemaRef: z.string().min(1),
  rollout: z.object({
    /** strategy 描述提示 rollout 策略，类似 K8s 部署策略以控制实验范围。 */
    strategy: z.string().min(1),
    /** stages 定义 rollout 阶段集合，帮助看板按集群或百分比启用提示。 */
    stages: z.array(rolloutStageSchema).min(1),
  }),
})

const promptManifestSchema = z.array(promptManifestEntrySchema).min(1)

/** Manifest entry powering AI diagnostics so the observability board knows which prompt drove each K8s insight. */
export type PromptManifestEntry = z.infer<typeof promptManifestEntrySchema>

let manifestCache: PromptManifestEntry[] | null = null

/** Loads the prompt manifest from disk so the observability board can audit which AI templates are available. */
export async function loadPromptManifest(): Promise<PromptManifestEntry[]> {
  if (manifestCache) {
    return manifestCache
  }

  const raw = await fs.readFile(PROMPT_MANIFEST_PATH, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  manifestCache = promptManifestSchema.parse(parsed)
  return manifestCache
}

/** Returns metadata for a specific prompt id, enabling the board to surface model + rollout info per K8s insight. */
export async function getPromptMetadata(
  id: string,
): Promise<PromptManifestEntry | null> {
  const manifest = await loadPromptManifest()
  return manifest.find((entry) => entry.id === id) ?? null
}

/** Clears the in-memory manifest cache, useful when the prompt roster changes while the board is running. */
export function resetPromptManifestCache() {
  manifestCache = null
}
