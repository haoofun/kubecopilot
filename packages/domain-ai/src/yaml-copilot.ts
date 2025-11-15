import { ApiError } from '@infra-http/error'

import { getOpenAIClient } from './client'
import { loadPromptTemplate } from './prompts'
import { getAiProvider } from './provider'
import { extractJson } from './utils'
import {
  YamlCopilotModeSchema,
  YamlCopilotResponseSchema,
  type YamlCopilotMode,
  type YamlCopilotResponse,
} from './schemas/yaml-copilot'

/**
 * Describes the YAML editing request that the observability board passes to the AI assistant.
 */
export interface YamlCopilotContext {
  /** yaml 是原始 Kubernetes manifest，供 AI 在板内进行策略、探针等修改。 */
  yaml: string
  /** goal 描述运维目标（如“增加资源限制”），帮助 AI 在 K8s 语义下理解需求。 */
  goal: string
  /** mode 指示编辑模式（patch、explain 等），映射到看板操作按钮。 */
  mode: YamlCopilotMode
}

interface RunYamlCopilotOptions {
  /** model 允许看板覆盖具体 LLM，便于在不同集群做 A/B 测试。 */
  model?: string
  /** temperature 调整响应确定性，确保生成的 K8s YAML 可预测。 */
  temperature?: number
}

/**
 * Runs the YAML copilot prompt so operators can safely modify Kubernetes manifests inside the observability UI.
 */
export async function runYamlCopilot(
  context: YamlCopilotContext,
  options: RunYamlCopilotOptions = {},
): Promise<YamlCopilotResponse> {
  const { template, metadata } = await loadPromptTemplate('yaml-copilot')
  const provider = getAiProvider()
  const modelOverride = options.model ?? metadata?.model
  const temperatureOverride =
    options.temperature ?? metadata?.temperature ?? 0.2
  const mode = YamlCopilotModeSchema.parse(context.mode)
  const systemPrompt =
    'You are KubeCopilot, an expert SRE assistant that edits Kubernetes YAML safely.'
  const userPrompt = buildUserPrompt(template, {
    ...context,
    mode,
  })

  const content =
    provider === 'gemini'
      ? await runWithGemini(systemPrompt, userPrompt, {
          model: modelOverride,
        })
      : await runWithOpenAI(systemPrompt, userPrompt, {
          model: modelOverride,
          temperature: temperatureOverride,
        })

  const payload = extractJson(content)
  return YamlCopilotResponseSchema.parse(payload)
}

/** Builds the serialized prompt payload from the YAML copilot context for the LLM call. */
function buildUserPrompt(template: string, input: YamlCopilotContext): string {
  const serialized = JSON.stringify(
    {
      goal: input.goal,
      mode: input.mode,
      yaml: input.yaml,
    },
    null,
    2,
  )

  return `${template.trim()}

<CONTEXT>
${serialized}
</CONTEXT>`
}

/** Executes the YAML copilot prompt against OpenAI when that provider powers the board. */
async function runWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: { model?: string; temperature?: number },
): Promise<string> {
  const client = getOpenAIClient()
  const model = options.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const temperature = options.temperature ?? 0.2

  const completion = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new ApiError('Empty AI response received', 502, 'AI_EMPTY_RESPONSE')
  }
  return content
}

/** Executes the YAML copilot prompt against Gemini so on-prem clusters can still leverage AI editing. */
async function runWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options: { model?: string },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new ApiError(
      'Gemini API key is not configured',
      503,
      'AI_NOT_CONFIGURED',
    )
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const modelName =
    options.model ?? process.env.GEMINI_MODEL ?? 'gemini-1.5-pro-latest'
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName })
  const response = await model.generateContent([fullPrompt])

  const text = response.response?.text()
  if (!text) {
    throw new ApiError('Empty AI response received', 502, 'AI_EMPTY_RESPONSE')
  }
  return text
}
