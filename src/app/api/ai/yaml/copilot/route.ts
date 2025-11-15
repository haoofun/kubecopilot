import { NextRequest } from 'next/server'
import { z } from 'zod'
import yaml from 'js-yaml'

import {
  createSuccessResponse,
  createErrorResponse,
} from '@infra-http/response'
import { ValidationError } from '@infra-http/error'
import { runYamlCopilot } from '@domain-ai/yaml-copilot'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'

/**
 * Payload describing the raw Kubernetes YAML plus the operator's goal so the copilot can tailor its response.
 */
const bodySchema = z.object({
  yaml: z.string().min(1),
  goal: z.string().min(1),
  mode: z.enum(['explain', 'bestPractices', 'plan']).default('explain'),
})

/**
 * POST /api/ai/yaml/copilot validates the YAML, ensures it parses, and forwards the request to the AI assistant so
 * the observability board can display safe editing guidance or summaries.
 */
const handler = async (request: NextRequest) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return createErrorResponse(
      new ValidationError('Request body must be valid JSON'),
      'ai/yaml/copilot',
    )
  }

  const result = bodySchema.safeParse(payload)
  if (!result.success) {
    return createErrorResponse(
      new ValidationError('Invalid YAML copilot payload', {
        issues: result.error.issues.map((issue) => issue.message).join('; '),
      }),
      'ai/yaml/copilot',
    )
  }

  const trimmedYaml = result.data.yaml.trim()
  try {
    yaml.load(trimmedYaml)
  } catch (error) {
    return createErrorResponse(
      new ValidationError('YAML is invalid', {
        yaml:
          error instanceof Error ? error.message : 'Parser rejected document',
      }),
      'ai/yaml/copilot',
    )
  }

  try {
    const copilot = await runYamlCopilot({
      yaml: trimmedYaml,
      goal: result.data.goal.trim(),
      mode: result.data.mode,
    })

    return createSuccessResponse({ copilot })
  } catch (error) {
    return createErrorResponse(error, 'ai/yaml/copilot')
  }
}

export const POST = withApiTelemetry(
  { route: 'api/ai/yaml/copilot', category: 'AI' },
  handler,
)
