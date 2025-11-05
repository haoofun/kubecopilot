import { z } from 'zod'

export const DiagnosisSeveritySchema = z.enum([
  'info',
  'low',
  'medium',
  'high',
  'critical',
])

export const PodDiagnosisCauseSchema = z.object({
  title: z.string(),
  detail: z.string(),
  severity: DiagnosisSeveritySchema.optional(),
})

export const PodDiagnosisRecommendationSchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  steps: z.array(z.string()).optional(),
})

export const PodDiagnosisEvidenceSchema = z.object({
  label: z.string(),
  value: z.string(),
  context: z.string().optional(),
})

export const PodDiagnosisSchema = z.object({
  verdict: z.enum(['healthy', 'investigate', 'unhealthy']),
  summary: z.string(),
  primary_issue: z.string().optional(),
  causes: z.array(PodDiagnosisCauseSchema).default([]),
  recommendations: z.array(PodDiagnosisRecommendationSchema).default([]),
  evidence: z.array(PodDiagnosisEvidenceSchema).optional(),
  confidence: z.number().min(0).max(1).optional(),
  warnings: z.array(z.string()).optional(),
})

export type PodDiagnosis = z.infer<typeof PodDiagnosisSchema>
