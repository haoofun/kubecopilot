import { ApiError } from '@infra-http/error'

/**
 * Extracts the JSON payload from an LLM response so downstream callers only see valid JSON.
 */
export function extractJson(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}$/)
  if (!jsonMatch) {
    throw new ApiError(
      'AI response does not contain JSON payload',
      502,
      'AI_INVALID_RESPONSE',
    )
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new ApiError(
      'Failed to parse AI response JSON',
      502,
      'AI_INVALID_JSON',
      {
        raw: jsonMatch[0],
        error: error instanceof Error ? error.message : error,
      },
    )
  }
}
