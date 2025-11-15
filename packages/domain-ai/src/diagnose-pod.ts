import type { CoreV1Event as V1Event, V1Pod } from '@kubernetes/client-node'
import { ApiError } from '@infra-http/error'
import { GoogleGenerativeAI } from '@google/generative-ai'

import { getOpenAIClient } from './client'
import { loadPromptTemplate } from './prompts'
import { PodDiagnosisSchema, type PodDiagnosis } from './schemas/diagnosis'
import { getAiProvider } from './provider'
import { extractJson } from './utils'

/**
 * Normalized subset of Kubernetes events so the observability board can feed concise context into AI diagnoses.
 */
export interface NormalizedEvent {
  /** type 保留 Normal/Warning，帮助看板按 K8s 事件级别调色。 */
  type: string
  /** reason 对应 K8s `reason` 字段，描述触发事件的组件状态。 */
  reason: string
  /** message 来自事件 `message`，供 AI 和 UI 解释具体现象。 */
  message: string
  /** count 告诉看板和 AI 该事件重复次数，直接映射 K8s 聚合计数。 */
  count: number
  /** lastTimestamp 记录最近一次触发时间，源自事件对象的时间戳字段。 */
  lastTimestamp?: string
}

/**
 * Log samples taken per container so the board can pass representative output to AI explainers.
 */
export interface NormalizedLog {
  /** container 指明日志所属容器，与 Pod spec 中的容器名一致。 */
  container: string
  /** sample 保存精简日志片段，帮助 AI 结合 K8s 状态定位问题。 */
  sample: string
}

/**
 * Aggregated context that ties Kubernetes pod data, events, and logs to the observability board's AI workflows.
 */
export interface PodDiagnosisContext {
  /** namespace 表明 Pod 所属命名空间，对应 K8s metadata.namespace。 */
  namespace: string
  /** podName 即 metadata.name，用于在看板和 AI 输出之间对齐标识。 */
  podName: string
  /** pod 携带完整的 V1Pod 对象，让 AI 直接读取 Kubernetes 状态。 */
  pod: V1Pod
  /** events 包含归一化 K8s 事件，为诊断提供时间线。 */
  events: NormalizedEvent[]
  /** logs 提供按容器采样的日志片段，关联 Kubernetes 容器名称。 */
  logs: NormalizedLog[]
}

/**
 * Serializable snapshot of the pod spec/status, mirroring Kubernetes fields the observability board surfaces to AI.
 */
interface PodSnapshot {
  metadata: {
    /** name 与 metadata.name 相同，帮助看板和 AI 对齐 Pod 标识。 */
    name?: string
    /** namespace 与 metadata.namespace 相同，指明租户边界。 */
    namespace?: string
    /** labels 携带 metadata.labels，让 AI 理解工作负载标签与 K8s 选择器。 */
    labels?: Record<string, string>
    /** annotations 保留 metadata.annotations，用于引用部署工具或 SLO 信息。 */
    annotations?: Record<string, string>
    /** creationTimestamp 来源 metadata.creationTimestamp，便于分析生命周期。 */
    creationTimestamp?: string
    /** uid 对应 metadata.uid，保证引用唯一。 */
    uid?: string
  }
  spec: {
    /** nodeName 表示 Pod 调度到的节点（spec.nodeName），用于排查节点问题。 */
    nodeName?: string | null
    /** serviceAccountName 告诉 AI Pod 以哪个 ServiceAccount 运行（权限上下文）。 */
    serviceAccountName?: string | null
    /** restartPolicy 映射 spec.restartPolicy，表示 Kubernetes 如何处理容器退出。 */
    restartPolicy?: string | null
    /** containers 描述每个容器的镜像与探针配置，映射 `spec.containers`. */
    containers: Array<{
      /** name 是容器名，对应 spec.containers[].name。 */
      name: string
      /** image 显示镜像（spec.containers[].image），让 AI 查版本或 registry。 */
      image?: string
      /** resources 保存 request/limit，说明 Kubernetes 调度约束。 */
      resources?: Record<string, unknown>
      /** readinessProbe 引用 spec.containers[].readinessProbe，刻画健康检查。 */
      readinessProbe?: Record<string, unknown>
      /** livenessProbe 对应 spec.containers[].livenessProbe，帮助定位探针失败。 */
      livenessProbe?: Record<string, unknown>
      /** env 保留环境变量映射，反映 Kubernetes 注入的配置或 Secret。 */
      env?: Array<{ name?: string; value?: string; [key: string]: unknown }>
      /** volumeMounts 说明容器挂载点，供 AI 理解数据依赖。 */
      volumeMounts?: Array<{
        name?: string
        mountPath?: string
        readOnly?: boolean
        [key: string]: unknown
      }>
      /** ports 表示容器暴露端口，帮助判断服务探针或通信问题。 */
      ports?: Array<{
        containerPort?: number
        name?: string
        protocol?: string
        [key: string]: unknown
      }>
    }>
  }
  status: {
    /** phase 直接引用 status.phase，代表 Pod 生命周期阶段。 */
    phase?: string
    /** reason 反映 Kubernetes 报告的失败原因（status.reason）。 */
    reason?: string
    /** message 为 status.message，给出更详细的调度信息。 */
    message?: string
    /** podIP/hostIP 描述数据路径，映射 status.podIP/hostIP。 */
    podIP?: string | null
    hostIP?: string | null
    /** startTime 指出 Pod 自启时间（status.startTime）。 */
    startTime?: string
    conditions: Array<{
      /** type/status/reason/message/lastTransitionTime 直接对应 status.conditions[*] 字段。 */
      type?: string
      status?: string
      reason?: string
      message?: string
      lastTransitionTime?: string
    }>
    containerStatuses: Array<{
      /** name/ready/restartCount/state/lastState 来自 status.containerStatuses。 */
      name?: string
      ready?: boolean
      restartCount?: number
      state?: unknown
      lastState?: unknown
    }>
  }
}

/** Builds a trimmed pod snapshot matching Kubernetes metadata/spec/status so AI can reason about what the observability board is showing. */
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

/** Serializes pod context into the prompt format consumed by AI-powered observability explanations. */
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

/**
 * Executes the pod diagnosis prompt against the configured AI provider so the observability board can display human-readable remediation steps.
 */
export async function runPodDiagnosis(
  context: PodDiagnosisContext,
  options: { model?: string; temperature?: number } = {},
): Promise<PodDiagnosis> {
  const { template, metadata } = await loadPromptTemplate('diagnose-pod')
  const systemPrompt =
    'You are KubeCopilot, an expert SRE assistant focused on diagnosing Kubernetes pod health issues.'
  const userPrompt = buildUserPrompt(template, context)

  const provider = getAiProvider()
  const modelOverride = options.model ?? metadata?.model
  const temperatureOverride =
    options.temperature ?? metadata?.temperature ?? 0.2
  const content =
    provider === 'gemini'
      ? await runWithGemini(systemPrompt, userPrompt, {
          model: modelOverride,
        })
      : await runWithOpenAI(systemPrompt, userPrompt, {
          model: modelOverride,
          temperature: temperatureOverride,
        })

  const payload = extractJson(content)
  const diagnosis = PodDiagnosisSchema.parse(payload)
  return diagnosis
}

/** Calls OpenAI chat completions with the prepared prompts, returning the text that feeds the board's diagnosis cards. */
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

/** Invokes Gemini when configured so observability features remain provider-agnostic. */
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

/** Normalizes Kubernetes events to an ISO-string timeline so AI and the observability board consume consistent data. */
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

/** Deduplicates and truncates log output so the board provides concise, privacy-aware samples to the AI pipeline. */
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
