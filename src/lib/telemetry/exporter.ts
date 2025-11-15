import type { TelemetryOverview } from './metrics'

/**
 * Minimal OpenTelemetry-style exporter stub.
 * Future implementation can push metrics to OTLP/Prometheus.
 */
export async function exportTelemetrySnapshot(
  snapshot: TelemetryOverview,
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  console.info('[telemetry] snapshot', {
    window: snapshot.window,
    apiRequests: snapshot.api.total,
    planSuccessRate: snapshot.plans.successRate,
  })
}
