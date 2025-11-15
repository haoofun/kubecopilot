import { promises as fs } from 'fs'
import path from 'path'

import {
  getPromptMetadata,
  type PromptManifestEntry,
} from '@domain-ai/prompt-registry'

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

/**
 * Represents a prompt file and manifest metadata so the observability board can display which AI template generated insights.
 */
export interface LoadedPromptTemplate {
  /** template 保留 LLM 指令文本，使诊断面板清楚引用了哪段 Kubernetes 分析提示。 */
  template: string
  /** metadata 引用 prompt manifest，用于在看板上标识模型、风险等级等信息。 */
  metadata: PromptManifestEntry | null
}

/**
 * Loads a prompt either by manifest id or file path so AI-powered observability features can fetch the right instructions.
 */
export async function loadPromptTemplate(
  idOrPath: string,
): Promise<LoadedPromptTemplate> {
  try {
    const metadata = await getPromptMetadata(idOrPath)
    const templatePath = metadata?.templatePath ?? idOrPath
    const filePath = path.join(PROMPTS_DIR, templatePath)
    const content = await fs.readFile(filePath, 'utf8')
    return {
      template: content,
      metadata: metadata ?? null,
    }
  } catch (error) {
    console.warn(
      `[ai.prompts] Unable to load prompt template "${idOrPath}", falling back to default instructions.`,
      error,
    )
    return {
      template: `You are an SRE assistant who analyses Kubernetes pod state, recent events, and container logs.
Return a concise JSON object that matches the agreed schema. Use the provided context only.
`,
      metadata: null,
    }
  }
}
