import { NextRequest } from 'next/server'
import type { V1Pod } from '@kubernetes/client-node'

import {
  createSuccessResponse,
  createErrorResponse,
} from '@infra-http/response'
import { ValidationError } from '@infra-http/error'
import { getCoreV1Api } from '@domain-k8s/client'
import {
  normalizeEvents,
  runPodDiagnosis,
  sanitizeLogSample,
  type NormalizedLog,
} from '@domain-ai/diagnose-pod'
import { ensureAiProviderConfigured } from '@domain-ai/provider'
import { withApiTelemetry } from '@/lib/telemetry/api-logger'

/**
 * Request payload for the pod diagnosis endpoint; namespace/name pair tie the AI output back to a specific Kubernetes pod.
 */
interface DiagnosePodBody {
  namespace?: string
  name?: string
}

/**
 * Reads logs for every container in the pod so the observability board can give the AI assistant enough runtime context.
 */
async function fetchContainerLogs(
  coreApi: Awaited<ReturnType<typeof getCoreV1Api>>,
  pod: V1Pod,
  namespace: string,
  name: string,
) {
  const containers = pod.spec?.containers ?? []

  const logResults = await Promise.allSettled(
    containers.map(async (container) => {
      const log = await coreApi.readNamespacedPodLog({
        namespace,
        name,
        container: container.name,
        tailLines: 200,
        timestamps: true,
      })

      return {
        container: container.name,
        sample: sanitizeLogSample(log ?? ''),
      }
    }),
  )

  const logs: NormalizedLog[] = []
  const logWarnings: string[] = []

  logResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      if (result.value.sample) {
        logs.push(result.value)
      }
    } else {
      logWarnings.push(
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
      )
    }
  })

  return { logs, logWarnings }
}

/**
 * POST /api/ai/diagnose/pod proxies the observability board's diagnose action to Kubernetes + the AI runtime,
 * ensuring events/logs/snapshots from the requested pod feed into the LLM for a contextual SRE summary.
 */
const handleDiagnosePost = async (request: NextRequest) => {
  const body = (await request.json().catch(() => ({}))) as DiagnosePodBody
  const namespace = body.namespace?.trim()
  const name = body.name?.trim()

  if (!namespace) {
    return createErrorResponse(
      new ValidationError('Namespace is required', { namespace: 'Required' }),
      'ai/diagnose-pod',
    )
  }

  if (!name) {
    return createErrorResponse(
      new ValidationError('Pod name is required', { name: 'Required' }),
      'ai/diagnose-pod',
    )
  }

  try {
    ensureAiProviderConfigured()
    const coreApi = await getCoreV1Api()

    const [pod, eventsResponse] = await Promise.all([
      coreApi.readNamespacedPod({ namespace, name }),
      coreApi.listNamespacedEvent({
        namespace,
        fieldSelector: `involvedObject.name=${name}`,
      }),
    ])

    const filteredEvents = (eventsResponse.items ?? []).filter(
      (event) => event.involvedObject?.name === name,
    )

    const normalizedEvents = normalizeEvents(filteredEvents)
    const { logs, logWarnings } = await fetchContainerLogs(
      coreApi,
      pod,
      namespace,
      name,
    )

    const diagnosis = await runPodDiagnosis({
      namespace,
      podName: name,
      pod,
      events: normalizedEvents,
      logs,
    })

    return createSuccessResponse({
      diagnosis,
      context: {
        events: normalizedEvents,
        logs,
        warnings: logWarnings,
      },
    })
  } catch (error) {
    return createErrorResponse(error, 'ai/diagnose-pod')
  }
}

export const POST = withApiTelemetry(
  { route: 'api/ai/diagnose/pod', category: 'AI' },
  handleDiagnosePost,
)
