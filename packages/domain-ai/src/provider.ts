import { ApiError } from '@infra-http/error'

/** Observability board supports multiple AI explainers; this union tracks which provider (matching env vars) is active. */
export type AiProvider = 'openai' | 'gemini'

const DEFAULT_PROVIDER: AiProvider = 'openai'

/** Determines which AI backend is usable based on env configuration so the board routes diagnostics accordingly. */
function detectProvider(): AiProvider {
  const configured = process.env.AI_PROVIDER?.toLowerCase()
  if (configured === 'gemini') return 'gemini'
  if (configured === 'openai') return 'openai'

  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.GEMINI_API_KEY) return 'gemini'

  return DEFAULT_PROVIDER
}

/** Returns the detected provider so downstream diagnostics label which AI model produced observability insights. */
export function getAiProvider(): AiProvider {
  return detectProvider()
}

/** Throws if no API key is present, preventing the board from surfacing AI-powered panels when credentials are missing. */
export function ensureAiProviderConfigured(): void {
  const provider = getAiProvider()
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new ApiError(
      'AI provider is not configured',
      503,
      'AI_NOT_CONFIGURED',
    )
  }
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new ApiError(
      'AI provider is not configured',
      503,
      'AI_NOT_CONFIGURED',
    )
  }
}
