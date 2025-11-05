import { NextRequest } from 'next/server'
import type { V1Pod } from '@kubernetes/client-node'

import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import { ValidationError } from '@/lib/api/error'
import { getCoreV1Api } from '@/lib/k8s/client'
import {
  normalizeEvents,
  runPodDiagnosis,
  sanitizeLogSample,
  type NormalizedLog,
} from '@/lib/ai/diagnose-pod'
import { ensureAiProviderConfigured } from '@/lib/ai/provider'

interface DiagnosePodBody {
  namespace?: string
  name?: string
}

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

export async function POST(request: NextRequest) {
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
