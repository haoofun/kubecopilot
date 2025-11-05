'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NamespaceDetail } from '@/lib/k8s/types/namespace'

interface NamespaceInsightsProps {
  summary: NamespaceDetail
}

const metricRow = (label: string, value: string | number) => (
  <div className="flex items-center justify-between gap-2 text-xs">
    <span className="text-foreground font-medium">{label}</span>
    <span className="text-muted-foreground font-mono">{value}</span>
  </div>
)

export function NamespaceInsights({ summary }: NamespaceInsightsProps) {
  const workloads = summary.workloads
  const networking = summary.networking
  const config = summary.config
  const quota = summary.resourceUsage

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Workloads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workloads ? (
            <>
              {metricRow(
                'Deployments Ready',
                `${workloads.deployments.ready}/${workloads.deployments.count}`,
              )}
              {metricRow(
                'StatefulSets Ready',
                `${workloads.statefulSets.ready}/${workloads.statefulSets.count}`,
              )}
              {metricRow(
                'DaemonSets Ready',
                `${workloads.daemonSets.ready}/${workloads.daemonSets.count}`,
              )}
              {metricRow(
                'Pods Running',
                `${workloads.pods.running}/${workloads.pods.count}`,
              )}
              {metricRow(
                'Jobs Succeeded',
                `${workloads.jobs.succeeded}/${workloads.jobs.count}`,
              )}
              {metricRow('Jobs Failed', workloads.jobs.failed)}
              {metricRow('Active CronJobs', workloads.cronJobs.active)}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No workload data available.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Networking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {networking ? (
            <>
              {metricRow('Services', networking.services.count)}
              {metricRow('Ingresses', networking.ingresses.count)}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No networking resources found.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Config & Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {config ? (
            <>
              {metricRow('ConfigMaps', config.configMaps.count)}
              {metricRow('Secrets', config.secrets.count)}
              {metricRow(
                'PersistentVolumeClaims',
                config.persistentVolumeClaims.count,
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No config resources recorded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Resource Quotas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quota ? (
            <>
              {metricRow('Requests CPU', quota.requests.cpu)}
              {metricRow('Requests Memory', quota.requests.memory)}
              {metricRow('Limits CPU', quota.limits.cpu)}
              {metricRow('Limits Memory', quota.limits.memory)}
              {quota.usage ? (
                <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                  <p className="text-foreground font-medium">Usage</p>
                  <p>CPU {quota.usage.cpu}</p>
                  <p>Memory {quota.usage.memory}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Usage data unavailable.
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No ResourceQuota configured for this namespace.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
