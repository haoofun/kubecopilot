'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/card'
import { Badge } from '@ui-kit/badge'
import { ResourceInspector } from '@/components/resources/ResourceInspector'
import { ResourceEvents } from '@/components/resources/ResourceEvents'
import { ResourceRelations } from '@/components/resources/ResourceRelations'
import { buildPodRelations } from '@/components/resources/relations-helpers'
import { ReadOnlyYamlViewer } from '@/components/k8s/shared/ReadOnlyYamlViewer'
import { PodInfoCard } from '@/components/k8s/pods/PodInfoCard'
import { PodContainersCard } from '@/components/k8s/pods/PodContainersCard'
import { PodVolumesCard } from '@/components/k8s/pods/PodVolumesCard'
import type { DetailResponse } from '@domain-k8s/types/common'
import type { PodDetail, PodToleration } from '@domain-k8s/types/pod'

interface PodInspectorProps {
  detail?: DetailResponse<PodDetail>
  isLoading?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function PodInspector({
  detail,
  isLoading,
  collapsed,
  onCollapsedChange,
}: PodInspectorProps) {
  const summary = detail?.summary

  const relations = useMemo(
    () => buildPodRelations(summary, detail?.raw),
    [summary, detail?.raw],
  )

  const scheduling = useMemo(() => {
    if (!summary) return null
    return {
      serviceAccountName: summary.serviceAccountName ?? 'default',
      priorityClassName: summary.priorityClassName ?? '—',
      nodeSelector: summary.nodeSelector,
      tolerations: summary.tolerations,
      imagePullSecrets: summary.imagePullSecrets,
      dnsPolicy: summary.dnsPolicy ?? 'ClusterFirst',
      hostNetwork: summary.hostNetwork ? 'Enabled' : 'Disabled',
      hostPID: summary.hostPID ? 'Enabled' : 'Disabled',
      hostIPC: summary.hostIPC ? 'Enabled' : 'Disabled',
    }
  }, [summary])

  const sections = summary
    ? [
        {
          id: 'summary',
          label: 'Summary',
          content: (
            <PodSummarySection detail={summary} scheduling={scheduling} />
          ),
        },
        {
          id: 'relations',
          label: 'Related',
          content: <ResourceRelations relations={relations} />,
        },
        {
          id: 'status',
          label: 'Status & Conditions',
          content: <PodStatusSection detail={summary} />,
        },
        {
          id: 'references',
          label: 'Referenced Manifests',
          content: <PodReferenceSection detail={summary} />,
        },
        {
          id: 'events',
          label: 'Events',
          content: (
            <ResourceEvents
              resourceBase="pods"
              namespace={summary.namespace}
              name={summary.name}
              uid={summary.uid}
              kind="Pod"
            />
          ),
        },
        {
          id: 'yaml',
          label: 'YAML',
          content: (
            <ReadOnlyYamlViewer
              yaml={detail?.yaml}
              raw={detail?.raw}
              showCopyButton
            />
          ),
        },
      ]
    : []

  return (
    <ResourceInspector
      title={summary ? summary.name : 'Inspector'}
      sections={sections}
      isLoading={isLoading}
      hasSelection={Boolean(summary)}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    />
  )
}

function PodSummarySection({
  detail,
  scheduling,
}: {
  detail: PodDetail
  scheduling: ReturnType<typeof useMemo> | null
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <PodInfoCard summary={detail} />
        <PodSchedulingCard scheduling={scheduling} />
      </div>
    </div>
  )
}

function PodStatusSection({ detail }: { detail: PodDetail }) {
  return <PodStatusCard summary={detail} />
}

function PodReferenceSection({ detail }: { detail: PodDetail }) {
  return (
    <div className="space-y-4">
      <PodVolumesCard pod={detail} />
      <PodContainersCard pod={detail} />
      {detail.initContainers.length > 0 ? (
        <PodInitContainersCard containers={detail.initContainers} />
      ) : null}
    </div>
  )
}

function PodSchedulingCard({
  scheduling,
}: {
  scheduling: ReturnType<typeof useMemo> | null
}) {
  if (!scheduling) return null

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Scheduling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoItem
            label="Service Account"
            value={scheduling.serviceAccountName}
          />
          <InfoItem
            label="Priority Class"
            value={scheduling.priorityClassName}
          />
          <InfoItem label="DNS Policy" value={scheduling.dnsPolicy} />
          <InfoItem label="Host Network" value={scheduling.hostNetwork} />
          <InfoItem label="Host PID" value={scheduling.hostPID} />
          <InfoItem label="Host IPC" value={scheduling.hostIPC} />
        </div>
        <InfoBlock label="Node Selector">
          <KeyValueList data={scheduling.nodeSelector} />
        </InfoBlock>
        <InfoBlock label="Tolerations">
          {scheduling.tolerations.length === 0 ? (
            <p className="text-muted-foreground text-sm">None</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {scheduling.tolerations.map((tol, index) => (
                <li
                  key={`${tol.key}-${index}`}
                  className="rounded border px-2 py-1"
                >
                  {formatToleration(tol)}
                </li>
              ))}
            </ul>
          )}
        </InfoBlock>
        <InfoBlock label="Image Pull Secrets">
          {scheduling.imagePullSecrets.length === 0 ? (
            <p className="text-muted-foreground text-sm">None</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {scheduling.imagePullSecrets.map((secret) => (
                <Badge key={secret} variant="secondary">
                  {secret}
                </Badge>
              ))}
            </div>
          )}
        </InfoBlock>
      </CardContent>
    </Card>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p>{value}</p>
    </div>
  )
}

function InfoBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {children}
    </div>
  )
}

function formatToleration(toleration: PodToleration) {
  const parts = [
    toleration.key ? `${toleration.key}` : 'key=*',
    toleration.operator ? toleration.operator : 'Equal',
    toleration.value ?? '*',
  ]
  if (toleration.effect) {
    parts.push(`effect=${toleration.effect}`)
  }
  if (typeof toleration.tolerationSeconds === 'number') {
    parts.push(`seconds=${toleration.tolerationSeconds}`)
  }
  return parts.join(' · ')
}

function KeyValueList({ data }: { data: Record<string, string> }) {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">None</p>
  }
  return (
    <dl className="grid gap-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-wrap gap-1">
          <dt className="text-muted-foreground font-mono text-xs">{key}</dt>
          <dd className="font-mono text-xs">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function PodInitContainersCard({
  containers,
}: {
  containers: PodDetail['initContainers']
}) {
  if (containers.length === 0) return null
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Init Containers</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="pb-2">Name</th>
              <th className="pb-2">Image</th>
              <th className="pb-2">State</th>
              <th className="pb-2">Restarts</th>
            </tr>
          </thead>
          <tbody>
            {containers.map((container) => (
              <tr key={container.name} className="border-t">
                <td className="py-2">{container.name}</td>
                <td className="py-2">{container.image}</td>
                <td className="py-2">
                  <Badge variant="outline">
                    {container.status ?? 'Unknown'}
                  </Badge>
                </td>
                <td className="py-2">{container.restarts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function PodStatusCard({ summary }: { summary: PodDetail }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoItem label="Phase" value={summary.phase ?? 'Unknown'} />
          <InfoItem label="QoS Class" value={summary.qosClass ?? '—'} />
          <InfoItem
            label="Pod IPs"
            value={
              summary.podIPs.length ? summary.podIPs.join(', ') : summary.ip
            }
          />
          <InfoItem label="Host IP" value={summary.hostIP ?? '—'} />
          <InfoItem label="Start Time" value={summary.startTime ?? '—'} />
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Conditions</p>
          <dl className="space-y-2 text-xs">
            {summary.conditions.map((condition) => (
              <div key={condition.type} className="rounded border p-2">
                <dt className="font-semibold">{condition.type}</dt>
                <dd className="text-muted-foreground">
                  {condition.status}
                  {condition.reason ? ` · ${condition.reason}` : ''}
                </dd>
                {condition.message ? (
                  <p className="text-muted-foreground/80">
                    {condition.message}
                  </p>
                ) : null}
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
