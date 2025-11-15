'use client'

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'
import yaml from 'js-yaml'
import { Alert, AlertDescription, AlertTitle } from '@ui-kit/alert'
import { Badge } from '@ui-kit/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui-kit/card'
import { Button } from '@ui-kit/button'
import { Textarea } from '@ui-kit/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui-kit/tabs'
import {
  Loader2,
  Target,
  Wand2,
  ShieldCheck,
  ClipboardCheck,
  FileCode,
  RefreshCcw,
  Save,
  Send,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import type {
  JsonPatchOperation,
  OperationPlanAction,
} from '@/lib/operation-plan/types'
import type { YamlCopilotResponse } from '@domain-ai/schemas/yaml-copilot'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
})

type CopilotMode = 'explain' | 'bestPractices' | 'plan'

const copilotModes: Array<{
  id: CopilotMode
  label: string
  description: string
  icon: typeof Target
}> = [
  {
    id: 'explain',
    label: 'Explain',
    description: 'Summarize manifest and highlight risky sections.',
    icon: Target,
  },
  {
    id: 'bestPractices',
    label: 'Best Practices',
    description: 'Lint for missing probes, labels, and policy gaps.',
    icon: ShieldCheck,
  },
  {
    id: 'plan',
    label: 'Plan Changes',
    description: 'Generate a multi-step OperationPlan draft.',
    icon: ClipboardCheck,
  },
]

const sampleYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments-api
  namespace: production
  labels:
    app: payments-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: payments-api
  template:
    metadata:
      labels:
        app: payments-api
    spec:
      containers:
        - name: payments-api
          image: ghcr.io/kubecorp/payments-api:v1.2.3
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
`

interface LineDiff {
  line: number
  before?: string
  after?: string
}

export default function YamlCopilotPage() {
  const [yamlValue, setYamlValue] = useState(sampleYaml)
  const [baselineYaml, setBaselineYaml] = useState(sampleYaml)
  const [goal, setGoal] = useState(
    'Scale to 4 replicas and add liveness probes for resiliency.',
  )
  const [mode, setMode] = useState<CopilotMode>('explain')
  const [copilotResult, setCopilotResult] =
    useState<YamlCopilotResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promoteStatus, setPromoteStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const lineDiff = useMemo(
    () => computeLineDiff(baselineYaml, yamlValue),
    [baselineYaml, yamlValue],
  )

  const handleFormat = useCallback(() => {
    try {
      const parsed = yaml.load(yamlValue)
      const formatted = yaml.dump(parsed, {
        lineWidth: -1,
        noRefs: true,
      })
      setYamlValue(formatted)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to format YAML content.',
      )
    }
  }, [yamlValue])

  const handleValidate = useCallback(() => {
    try {
      yaml.load(yamlValue)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'YAML validation failed.')
    }
  }, [yamlValue])

  const handleResetSample = useCallback(() => {
    setYamlValue(sampleYaml)
    setBaselineYaml(sampleYaml)
    setCopilotResult(null)
    setError(null)
  }, [])

  const handleGenerate = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setPromoteStatus(null)
    try {
      const response = await fetch('/api/ai/yaml/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yaml: yamlValue,
          goal,
          mode,
        }),
      })
      const data = await response.json()
      if (!response.ok || data?.success === false) {
        const message =
          data?.error?.message || data?.message || 'AI request failed.'
        throw new Error(message)
      }
      setCopilotResult(data.data.copilot as YamlCopilotResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed.')
    } finally {
      setIsLoading(false)
    }
  }, [goal, mode, yamlValue])

  const handleApplySnippet = useCallback((snippet: string | undefined) => {
    if (!snippet) return
    setYamlValue((prev) => {
      const needsNewline = !prev.endsWith('\n')
      return `${prev}${needsNewline ? '\n' : ''}${snippet}\n`
    })
  }, [])

  const handlePromotePlan = useCallback(async () => {
    if (!copilotResult?.operationPlan) {
      return
    }

    setIsPromoting(true)
    setPromoteStatus(null)

    try {
      const baselineObj = parseYamlObject(baselineYaml)
      const currentObj = parseYamlObject(yamlValue)
      const diffPatch = buildJsonPatch(baselineObj, currentObj)
      if (diffPatch.length === 0) {
        throw new Error('Baseline与当前 YAML 没有差异，无法生成 Plan。')
      }

      const rollbackPatch = buildJsonPatch(currentObj, baselineObj)
      const resourceRef = extractResourceRef(currentObj)
      if (!resourceRef) {
        throw new Error(
          'YAML 需包含 kind、metadata.name、metadata.namespace 才能生成 OperationPlan。',
        )
      }

      const planPayload = {
        action: copilotResult.operationPlan.action ?? 'update',
        intent: copilotResult.operationPlan.intent,
        aiRationale: copilotResult.summary,
        requestedBy: 'user:yaml-copilot',
        resource: {
          kind: resourceRef.kind,
          namespace: resourceRef.namespace,
          name: resourceRef.name,
          resourceVersion: resourceRef.resourceVersion ?? 'unknown',
          href: resourceRef.href,
        },
        diff: {
          before: baselineObj,
          patch: diffPatch,
          rollbackPatch: rollbackPatch.length > 0 ? rollbackPatch : undefined,
          patchFormat: 'rfc6902' as const,
        },
        steps: copilotResult.operationPlan.steps.map((step, index) => ({
          id: step.id || `step-${index + 1}`,
          action: normalizePlanStepAction(step.action),
          description: step.description,
        })),
        sourcePromptId: 'yaml-copilot@0.1.0',
      }

      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planPayload),
      })
      const body = await response.json()
      if (!response.ok || body?.success === false) {
        const message =
          body?.error?.message || body?.message || 'Failed to create plan.'
        throw new Error(message)
      }

      setPromoteStatus({
        type: 'success',
        message: 'OperationPlan 草稿已创建，可前往 Operation Plans 查看。',
      })
    } catch (err) {
      setPromoteStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Plan 生成失败。',
      })
    } finally {
      setIsPromoting(false)
    }
  }, [baselineYaml, copilotResult, yamlValue])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            YAML Copilot
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Edit manifests with Monaco, then let AI explain, lint, or draft a
            safe OperationPlan before you roll out changes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleResetSample}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Load sample
          </Button>
          <Button variant="outline" onClick={() => setBaselineYaml(yamlValue)}>
            <Save className="mr-2 h-4 w-4" />
            Snapshot baseline
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>YAML Copilot error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCode className="text-primary h-5 w-5" />
                Manifest editor
              </CardTitle>
              <CardDescription>
                Powered by Monaco Editor with YAML syntax highlighting.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleValidate}>
                Validate
              </Button>
              <Button variant="outline" size="sm" onClick={handleFormat}>
                Auto format
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-xl border">
              <MonacoEditor
                language="yaml"
                theme="vs-dark"
                value={yamlValue}
                onChange={(value) => setYamlValue(value ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>AI Copilot</CardTitle>
            <CardDescription>
              Describe your intent and let AI guide YAML changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Goal
              </label>
              <Textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={3}
                placeholder="Describe the change you want to make..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Mode
              </label>
              <div className="grid gap-2">
                {copilotModes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`hover:border-primary rounded-xl border p-3 text-left transition ${
                      mode === item.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {mode === item.id ? (
                        <Badge variant="outline">Selected</Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs leading-5">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Ask Copilot
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Baseline vs current</CardTitle>
          <CardDescription>
            Snapshot differences help you reason about changes before creating a
            plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diff">
            <TabsList>
              <TabsTrigger value="diff">Line diff</TabsTrigger>
              <TabsTrigger value="baseline">Baseline YAML</TabsTrigger>
              <TabsTrigger value="current">Current YAML</TabsTrigger>
            </TabsList>
            <TabsContent value="diff">
              {lineDiff.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Baseline and current YAML are identical.
                </p>
              ) : (
                <div className="max-h-64 overflow-auto rounded-xl border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-xs tracking-wide uppercase">
                      <tr>
                        <th className="px-3 py-2">Line</th>
                        <th className="px-3 py-2">Baseline</th>
                        <th className="px-3 py-2">Current</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineDiff.map((entry) => (
                        <tr key={entry.line} className="border-t">
                          <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                            {entry.line}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {entry.before ?? '—'}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {entry.after ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="baseline">
              <pre className="bg-muted/30 max-h-80 overflow-auto rounded-xl border p-4 text-xs">
                {baselineYaml}
              </pre>
            </TabsContent>
            <TabsContent value="current">
              <pre className="bg-muted/30 max-h-80 overflow-auto rounded-xl border p-4 text-xs">
                {yamlValue}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {copilotResult ? (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Copilot summary</CardTitle>
              <CardDescription>
                AI insight tailored to your goal and current manifest.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6">{copilotResult.summary}</p>
              {copilotResult.riskCallouts.length > 0 ? (
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Risk callouts
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {copilotResult.riskCallouts.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {copilotResult.recommendations.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Recommendations
                  </p>
                  <div className="space-y-3">
                    {copilotResult.recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{rec.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {rec.impact}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-6">
                          {rec.summary}
                        </p>
                        {rec.path ? (
                          <p className="text-muted-foreground mt-1 font-mono text-xs">
                            {rec.path}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>OperationPlan draft</CardTitle>
              <CardDescription>
                Steps you can review before promoting to the command palette.
              </CardDescription>
              {copilotResult.operationPlan ? (
                <div className="mt-2">
                  <Button
                    className="w-full"
                    onClick={handlePromotePlan}
                    disabled={isPromoting}
                  >
                    {isPromoting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Promoting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Promote plan
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {copilotResult.operationPlan ? (
                <>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground text-xs font-semibold uppercase">
                      Intent
                    </p>
                    <p className="leading-6">
                      {copilotResult.operationPlan.intent}
                    </p>
                    {copilotResult.operationPlan.action ? (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {copilotResult.operationPlan.action}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {copilotResult.operationPlan.steps.map((step) => (
                      <div
                        key={step.id}
                        className="space-y-2 rounded-xl border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{step.description}</p>
                            <p className="text-muted-foreground text-xs tracking-wide uppercase">
                              {step.action}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {step.id}
                          </Badge>
                        </div>
                        {step.patch ? (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs uppercase">
                              Patch snippet
                            </p>
                            <pre className="bg-muted/30 max-h-32 overflow-auto rounded-lg border p-2 text-xs">
                              {step.patch}
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplySnippet(step.patch)}
                            >
                              Insert into editor
                            </Button>
                          </div>
                        ) : null}
                        {step.rollbackPatch ? (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs uppercase">
                              Rollback snippet
                            </p>
                            <pre className="bg-muted/30 max-h-32 overflow-auto rounded-lg border p-2 text-xs">
                              {step.rollbackPatch}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Run Copilot in plan mode to see a suggested OperationPlan.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {promoteStatus ? (
        <Alert
          variant={promoteStatus.type === 'error' ? 'destructive' : 'default'}
        >
          {promoteStatus.type === 'error' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <AlertTitle>
            {promoteStatus.type === 'error'
              ? 'Plan Promotion Error'
              : 'Success'}
          </AlertTitle>
          <AlertDescription>{promoteStatus.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

function computeLineDiff(before: string, after: string): LineDiff[] {
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  const maxLines = Math.max(beforeLines.length, afterLines.length)

  const diff: LineDiff[] = []
  for (let i = 0; i < maxLines; i += 1) {
    const beforeLine = beforeLines[i]
    const afterLine = afterLines[i]
    if (beforeLine === afterLine) {
      continue
    }
    diff.push({
      line: i + 1,
      before: beforeLine,
      after: afterLine,
    })
    if (diff.length >= 200) {
      break
    }
  }
  return diff
}

function parseYamlObject(value: string): Record<string, unknown> {
  const parsed = yaml.load(value)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('YAML 须解析为对象')
  }
  return parsed as Record<string, unknown>
}

function extractResourceRef(obj: Record<string, unknown>): {
  kind: string
  namespace: string
  name: string
  resourceVersion?: string
  href: string
} | null {
  const kind = typeof obj.kind === 'string' ? obj.kind : null
  const metadata =
    obj.metadata && typeof obj.metadata === 'object'
      ? (obj.metadata as Record<string, unknown>)
      : null

  const name =
    metadata && typeof metadata.name === 'string' ? metadata.name : null
  const namespace =
    metadata && typeof metadata.namespace === 'string'
      ? metadata.namespace
      : 'default'

  if (!kind || !name) {
    return null
  }

  const resourceVersion =
    metadata && typeof metadata.resourceVersion === 'string'
      ? metadata.resourceVersion
      : undefined

  const href = buildResourceHref(kind, namespace, name)

  return {
    kind,
    namespace,
    name,
    resourceVersion,
    href,
  }
}

function buildResourceHref(kind: string, namespace: string, name: string) {
  const lower = kind.toLowerCase()
  const singularToRoute: Record<string, string> = {
    deployment: 'deployments',
    pod: 'pods',
    service: 'services',
    statefulset: 'statefulsets',
    daemonset: 'daemonsets',
    job: 'jobs',
    cronjob: 'cronjobs',
    configmap: 'configmaps',
    secret: 'secrets',
    pvc: 'pvcs',
    pv: 'pvs',
    ingress: 'ingresses',
    namespace: 'namespaces',
    node: 'nodes',
  }

  const route = singularToRoute[lower] ?? `${lower}s`
  if (route === 'nodes' || route === 'pvs' || route === 'namespaces') {
    return `/${route}/${name}`
  }
  return `/${route}/${namespace}/${name}`
}

function buildJsonPatch(
  before: unknown,
  after: unknown,
  basePath = '',
): JsonPatchOperation[] {
  if (isEqual(before, after)) {
    return []
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    return diffArray(before, after, basePath)
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    return diffObject(before as Record<string, unknown>, after, basePath)
  }

  return [
    {
      op: 'replace',
      path: basePath || '',
      value: clone(after),
    },
  ]
}

function diffObject(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
  basePath: string,
): JsonPatchOperation[] {
  const ops: JsonPatchOperation[] = []
  const beforeKeys = new Set(Object.keys(before ?? {}))
  const afterKeys = new Set(Object.keys(after ?? {}))

  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) {
      ops.push({
        op: 'remove',
        path: joinPath(basePath, key),
      })
    }
  }

  for (const key of afterKeys) {
    const nextPath = joinPath(basePath, key)
    if (!beforeKeys.has(key)) {
      ops.push({
        op: 'add',
        path: nextPath,
        value: clone(after[key]),
      })
      continue
    }
    const nested = buildJsonPatch(before?.[key], after[key], nextPath)
    ops.push(...nested)
  }

  return ops
}

function diffArray(
  before: unknown[],
  after: unknown[],
  basePath: string,
): JsonPatchOperation[] {
  const ops: JsonPatchOperation[] = []
  const max = Math.max(before.length, after.length)

  for (let index = 0; index < max; index += 1) {
    const path = joinPath(basePath, String(index))
    if (index >= before.length) {
      ops.push({
        op: 'add',
        path,
        value: clone(after[index]),
      })
      continue
    }
    if (index >= after.length) {
      ops.push({
        op: 'remove',
        path,
      })
      continue
    }
    ops.push(...buildJsonPatch(before[index], after[index], path))
  }

  return ops
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function joinPath(base: string, key: string) {
  if (!base) {
    return `/${escapeJsonPointer(key)}`
  }
  return `${base}/${escapeJsonPointer(key)}`
}

function escapeJsonPointer(segment: string) {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1')
}

function clone<T>(value: T): T {
  return value === undefined
    ? value
    : (JSON.parse(JSON.stringify(value ?? null)) as T)
}

function normalizePlanStepAction(
  action: string | undefined,
): OperationPlanAction {
  const allowed: OperationPlanAction[] = [
    'create',
    'update',
    'delete',
    'scale',
    'restart',
  ]
  if (action && allowed.includes(action as OperationPlanAction)) {
    return action as OperationPlanAction
  }
  return 'update'
}
