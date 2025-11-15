#!/usr/bin/env node
import { readFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(currentDir, '..')
const manifestPath = join(projectRoot, 'prompts', 'manifest.json')

async function ensureFileExists(filePath) {
  try {
    await access(filePath)
  } catch {
    throw new Error(`File not found: ${filePath}`)
  }
}

const rolloutStageSchema = z.object({
  stage: z.string().min(1),
  percent: z.number().int().min(0).max(100),
  conditions: z.array(z.string().min(1)).default([]),
})

const promptEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  templatePath: z.string().min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
  owner: z.string().min(1),
  reviewedBy: z.array(z.string().min(1)).min(1),
  lastReviewedAt: z.string().min(1),
  riskTier: z.enum(['low', 'medium', 'high']),
  category: z.string().min(1),
  inputSchemaRef: z.string().min(1),
  outputSchemaRef: z.string().min(1),
  rollout: z.object({
    strategy: z.string().min(1),
    stages: z.array(rolloutStageSchema).min(1),
  }),
})

const manifestSchema = z.array(promptEntrySchema).min(1)

async function main() {
  try {
    const raw = await readFile(manifestPath, 'utf8')
    const manifest = manifestSchema.parse(JSON.parse(raw))

    for (const entry of manifest) {
      if (!entry?.id || !entry?.templatePath) {
        throw new Error(
          `Manifest entry is missing required fields: ${JSON.stringify(entry)}`,
        )
      }

      const templatePath = join(projectRoot, 'prompts', entry.templatePath)
      await ensureFileExists(templatePath)

      const templateContent = await readFile(templatePath, 'utf8')
      if (!templateContent.trim()) {
        throw new Error(
          `Prompt template "${entry.templatePath}" for id "${entry.id}" is empty.`,
        )
      }
    }

    console.info(
      `[prompt-validation] ${manifest.length} prompt(s) validated successfully.`,
    )
  } catch (error) {
    console.error('[prompt-validation] failed:', error)
    process.exit(1)
  }
}

await main()
