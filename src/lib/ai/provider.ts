import { ApiError } from '@/lib/api/error'

export type AiProvider = 'openai' | 'gemini'

const DEFAULT_PROVIDER: AiProvider = 'openai'

function detectProvider(): AiProvider {
  const configured = process.env.AI_PROVIDER?.toLowerCase()
  if (configured === 'gemini') return 'gemini'
  if (configured === 'openai') return 'openai'

  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.GEMINI_API_KEY) return 'gemini'

  return DEFAULT_PROVIDER
}

export function getAiProvider(): AiProvider {
  return detectProvider()
}

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
