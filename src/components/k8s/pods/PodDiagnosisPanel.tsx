'use client'

import { useState } from 'react'
import { Loader2, Stethoscope, Wand2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PodDiagnosis } from '@/lib/ai/schemas/diagnosis'

interface PodDiagnosisPanelProps {
  namespace: string
  name: string
}

type DiagnosisVerdict = PodDiagnosis['verdict']

interface DiagnosisContext {
  events: Array<{
    type: string
    reason: string
    message: string
    count: number
    lastTimestamp?: string
  }>
  logs: Array<{ container: string; sample: string }>
  warnings?: string[]
}

interface DiagnosePodSuccess {
  success: true
  data: {
    diagnosis: PodDiagnosis
    context: DiagnosisContext
  }
}

interface DiagnosePodError {
  success: false
  error: {
    message: string
  }
}

function verdictVariant(verdict: DiagnosisVerdict): {
  label: string
  variant: 'outline' | 'secondary' | 'destructive'
} {
  switch (verdict) {
    case 'healthy':
      return { label: 'Healthy', variant: 'secondary' }
    case 'investigate':
      return { label: 'Needs Attention', variant: 'outline' }
    case 'unhealthy':
      return { label: 'Unhealthy', variant: 'destructive' }
    default:
      return { label: verdict, variant: 'outline' }
  }
}

function formatTimestamp(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export function PodDiagnosisPanel({ namespace, name }: PodDiagnosisPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState<PodDiagnosis | null>(null)
  const [context, setContext] = useState<DiagnosisContext | null>(null)

  const handleDiagnose = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/diagnose/pod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ namespace, name }),
      })

      const payload = (await response.json()) as
        | DiagnosePodSuccess
        | DiagnosePodError

      if (!response.ok || payload.success === false) {
        throw new Error(
          payload.success === false
            ? payload.error.message
            : `Failed with status ${response.status}`,
        )
      }

      setDiagnosis(payload.data.diagnosis)
      setContext(payload.data.context)
    } catch (err) {
      setDiagnosis(null)
      setContext(null)
      setError(err instanceof Error ? err.message : 'Failed to run diagnosis.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderDiagnosis = () => {
    if (!diagnosis) {
      return (
        <Alert>
          <AlertTitle>Waiting for analysis</AlertTitle>
          <AlertDescription>
            Click Diagnose to request an AI summary for {namespace}/{name}.
          </AlertDescription>
        </Alert>
      )
    }

    const verdict = verdictVariant(diagnosis.verdict)

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={verdict.variant}>{verdict.label}</Badge>
          {diagnosis.confidence !== undefined ? (
            <span className="text-muted-foreground text-xs">
              Confidence {Math.round(diagnosis.confidence * 100)}%
            </span>
          ) : null}
        </div>

        <div className="text-muted-foreground text-sm leading-6">
          {diagnosis.summary}
        </div>

        {diagnosis.primary_issue ? (
          <Alert variant="destructive">
            <AlertTitle>Primary Issue</AlertTitle>
            <AlertDescription className="text-sm">
              {diagnosis.primary_issue}
            </AlertDescription>
          </Alert>
        ) : null}

        {diagnosis.causes.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-foreground text-sm font-semibold">
              Likely Causes
            </h4>
            <ul className="space-y-2">
              {diagnosis.causes.map((cause, index) => (
                <li
                  key={`${cause.title}-${index}`}
                  className="border-muted-foreground/20 bg-muted/30 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm font-medium">{cause.title}</span>
                    {cause.severity ? (
                      <Badge variant="outline" className="text-xs">
                        {cause.severity}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs leading-5">
                    {cause.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {diagnosis.recommendations.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-foreground text-sm font-semibold">
              Recommended Actions
            </h4>
            <ol className="text-muted-foreground space-y-2 text-sm">
              {diagnosis.recommendations.map((rec, index) => (
                <li
                  key={`${rec.title}-${index}`}
                  className="border-muted-foreground/20 bg-background rounded-lg border p-3"
                >
                  <p className="text-foreground font-medium">{rec.title}</p>
                  {rec.summary ? (
                    <p className="mt-1 text-xs leading-5">{rec.summary}</p>
                  ) : null}
                  {rec.steps ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
                      {rec.steps.map((step, stepIndex) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {diagnosis.evidence && diagnosis.evidence.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-foreground text-sm font-semibold">
              Supporting Evidence
            </h4>
            <ul className="text-muted-foreground space-y-1 text-xs">
              {diagnosis.evidence.map((item, index) => (
                <li
                  key={`${item.label}-${index}`}
                  className="border-muted-foreground/40 rounded border border-dashed px-2 py-1"
                >
                  <span className="text-foreground font-medium">
                    {item.label}:
                  </span>{' '}
                  {item.value}
                  {item.context ? (
                    <span className="text-muted-foreground/80 block text-[11px]">
                      {item.context}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {context?.events?.length ? (
          <div className="space-y-2">
            <h4 className="text-foreground text-sm font-semibold">
              Recent Events
            </h4>
            <ul className="text-muted-foreground space-y-1 text-xs">
              {context.events.slice(-5).map((event, index) => (
                <li
                  key={`${event.reason}-${index}`}
                  className="border-muted-foreground/20 bg-muted/20 rounded border px-2 py-1"
                >
                  <span className="text-foreground font-medium">
                    {event.reason}
                  </span>
                  <span className="text-muted-foreground/70 mx-1">·</span>
                  {event.message}
                  {event.lastTimestamp ? (
                    <span className="text-muted-foreground/80 block text-[11px]">
                      {formatTimestamp(event.lastTimestamp)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {context?.warnings && context.warnings.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4 text-xs">
                {context.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-5 w-5" />
            AI Diagnosis
          </CardTitle>
        </div>
        <Button size="sm" onClick={handleDiagnose} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <Stethoscope className="mr-2 h-4 w-4" />
              Diagnose
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Diagnosis failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          renderDiagnosis()
        )}
      </CardContent>
    </Card>
  )
}
