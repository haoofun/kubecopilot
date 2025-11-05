import type { CoreV1Event as V1Event, V1Pod } from '@kubernetes/client-node'
import { ApiError } from '@/lib/api/error'
import { GoogleGenerativeAI } from '@google/generative-ai'

import { getOpenAIClient } from './client'
import { loadPromptTemplate } from './prompts'
import { PodDiagnosisSchema, type PodDiagnosis } from './schemas/diagnosis'
import { getAiProvider } from './provider'

export interface NormalizedEvent {
  type: string
  reason: string
  message: string
  count: number
  lastTimestamp?: string
}

export interface NormalizedLog {
  container: string
  sample: string
}

export interface PodDiagnosisContext {
  namespace: string
  podName: string
  pod: V1Pod
  events: NormalizedEvent[]
  logs: NormalizedLog[]
}

interface PodSnapshot {
  metadata: {
    name?: string
    namespace?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    creationTimestamp?: string
    uid?: string
  }
  spec: {
    nodeName?: string | null
    serviceAccountName?: string | null
    restartPolicy?: string | null
    containers: Array<{
      name: string
      image?: string
      resources?: Record<string, unknown>
      readinessProbe?: Record<string, unknown>
      livenessProbe?: Record<string, unknown>
    }>
  }
  status: {
    phase?: string
    reason?: string
    message?: string
    podIP?: string | null
    hostIP?: string | null
    startTime?: string
    conditions: Array<{
      type?: string
      status?: string
      reason?: string
      message?: string
      lastTransitionTime?: string
    }>
    containerStatuses: Array<{
      name?: string
      ready?: boolean
      restartCount?: number
      state?: unknown
      lastState?: unknown
    }>
  }
}

function createPodSnapshot(pod: V1Pod): PodSnapshot {
  return {
    metadata: {
      name: pod.metadata?.name,
      namespace: pod.metadata?.namespace,
      labels: pod.metadata?.labels,
      annotations: pod.metadata?.annotations,
      creationTimestamp: pod.metadata?.creationTimestamp?.toISOString(),
      uid: pod.metadata?.uid,
    },
    spec: {
      nodeName: pod.spec?.nodeName ?? null,
      serviceAccountName: pod.spec?.serviceAccountName ?? null,
      restartPolicy: pod.spec?.restartPolicy ?? null,
      containers: (pod.spec?.containers ?? []).map((container) => ({
        name: container.name,
        image: container.image,
        resources: container.resources
          ? {
              limits: container.resources.limits,
              requests: container.resources.requests,
            }
          : undefined,
        readinessProbe: container.readinessProbe
          ? { ...container.readinessProbe }
          : undefined,
        livenessProbe: container.livenessProbe
          ? { ...container.livenessProbe }
          : undefined,
        env: container.env ?? undefined,
        volumeMounts: container.volumeMounts ?? undefined,
        ports: container.ports ?? undefined,
      })),
    },
    status: {
      phase: pod.status?.phase,
      reason: pod.status?.reason,
      message: pod.status?.message,
      podIP: pod.status?.podIP ?? null,
      hostIP: pod.status?.hostIP ?? null,
      startTime: pod.status?.startTime?.toISOString(),
      conditions: (pod.status?.conditions ?? []).map((condition) => ({
        type: condition.type,
        status: condition.status,
        reason: condition.reason,
        message: condition.message,
        lastTransitionTime: condition.lastTransitionTime?.toISOString(),
      })),
      containerStatuses: (pod.status?.containerStatuses ?? []).map(
        (status) => ({
          name: status.name,
          ready: status.ready,
          restartCount: status.restartCount,
          state: status.state ?? undefined,
          lastState: status.lastState ?? undefined,
        }),
      ),
    },
  }
}

function extractJson(text: string): unknown {
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

function buildUserPrompt(template: string, context: PodDiagnosisContext) {
  const payload = {
    namespace: context.namespace,
    podName: context.podName,
    snapshot: createPodSnapshot(context.pod),
    events: context.events,
    logs: context.logs,
  }

  const serializedContext = JSON.stringify(payload, null, 2)

  return `${template.trim()}

<CONTEXT>${serializedContext}</CONTEXT>`
}

export async function runPodDiagnosis(
  context: PodDiagnosisContext,
  options: { model?: string; temperature?: number } = {},
): Promise<PodDiagnosis> {
  const template = await loadPromptTemplate('diagnose-pod.md')
  const systemPrompt =
    'You are KubeCopilot, an expert SRE assistant focused on diagnosing Kubernetes pod health issues.'
  const userPrompt = buildUserPrompt(template, context)

  const provider = getAiProvider()
  const content =
    provider === 'gemini'
      ? await runWithGemini(systemPrompt, userPrompt, { model: options.model })
      : await runWithOpenAI(systemPrompt, userPrompt, options)

  const payload = extractJson(content)
  const diagnosis = PodDiagnosisSchema.parse(payload)
  return diagnosis
}

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

export function normalizeEvents(
  events: V1Event[] | undefined,
): NormalizedEvent[] {
  const toIsoString = (
    value: Date | string | undefined | null,
  ): string | undefined => {
    if (!value) {
      return undefined
    }
    if (typeof value === 'string') {
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    return undefined
  }

  return (events ?? [])
    .map((event) => ({
      type: event.type ?? 'Normal',
      reason: event.reason ?? 'Unknown',
      message: event.message ?? '',
      count: event.count ?? 1,
      lastTimestamp:
        toIsoString(event.lastTimestamp ?? undefined) ??
        toIsoString(event.eventTime ?? undefined),
    }))
    .sort((a, b) =>
      a.lastTimestamp && b.lastTimestamp
        ? a.lastTimestamp.localeCompare(b.lastTimestamp)
        : 0,
    )
}

export function sanitizeLogSample(log: string): string {
  if (!log) {
    return ''
  }

  const rows = log
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)

  const deduped: string[] = []
  for (const line of rows) {
    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line)
    }
  }

  const truncated = deduped.slice(-120)
  const joined = truncated.join('\n')

  if (joined.length > 8000) {
    return joined.slice(-8000)
  }

  return joined
}
