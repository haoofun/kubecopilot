// AI Orchestrator stub showing how prompt registry + loaders can be reused
// outside the Next.js runtime.
import {
  getPromptMetadata,
  loadPromptManifest,
} from '@domain-ai/prompt-registry'
import { loadPromptTemplate } from '@domain-ai/prompts'

export async function loadPrompt(promptId: string) {
  const manifest = await loadPromptManifest()
  const entry = manifest.find((item) => item.id === promptId)
  if (!entry) {
    throw new Error(`Prompt ${promptId} is not registered`)
  }

  const template = await loadPromptTemplate(promptId)
  return { entry, template }
}

export async function getPromptRollout(promptId: string) {
  const metadata = await getPromptMetadata(promptId)
  return metadata?.rollout ?? null
}
