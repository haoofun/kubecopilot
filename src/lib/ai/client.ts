import OpenAI from 'openai'

import { ApiError } from '@/lib/api/error'
import { getAiProvider } from './provider'

let cachedClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  const provider = getAiProvider()
  if (provider !== 'openai') {
    throw new ApiError(
      `OpenAI client requested while AI provider is set to "${provider}".`,
      500,
      'AI_PROVIDER_MISMATCH',
    )
  }

  if (cachedClient) {
    return cachedClient
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new ApiError(
      'OPENAI_API_KEY is not configured',
      503,
      'AI_NOT_CONFIGURED',
    )
  }

  cachedClient = new OpenAI({
    apiKey,
  })

  return cachedClient
}
