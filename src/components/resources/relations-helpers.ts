import type { CronJobDetail } from '@domain-k8s/types/cronjob'
import type { DaemonSetDetail } from '@domain-k8s/types/daemonset'
import type { DeploymentDetail } from '@domain-k8s/types/deployment'
import type { IngressDetail } from '@domain-k8s/types/ingress'
import type { JobDetail, JobSummary } from '@domain-k8s/types/job'
import type { NamespaceDetail } from '@domain-k8s/types/namespace'
import type { NodeDetail } from '@domain-k8s/types/node'
import type { PodDetail, PodSummary } from '@domain-k8s/types/pod'
import type { PVDetail } from '@domain-k8s/types/pv'
import type { PVCDetail } from '@domain-k8s/types/pvc'
import type { ServiceDetail } from '@domain-k8s/types/service'
import type { StatefulSetDetail } from '@domain-k8s/types/statefulset'

import type { ResourceRelation } from './ResourceRelations'

const RESOURCE_ROUTE_MAP: Record<string, string> = {
  Pod: 'pods',
  Deployment: 'deployments',
  StatefulSet: 'statefulsets',
  DaemonSet: 'daemonsets',
  Job: 'jobs',
  CronJob: 'cronjobs',
  Node: 'nodes',
  Namespace: 'namespaces',
  PersistentVolumeClaim: 'pvcs',
  ConfigMap: 'configmaps',
  Secret: 'secrets',
  Service: 'services',
  Ingress: 'ingresses',
  PersistentVolume: 'pvs',
}

const SUPPORTED_SELECTION_KINDS = new Set([
  'Pod',
  'Deployment',
  'Node',
  'StatefulSet',
  'DaemonSet',
  'Job',
  'CronJob',
  'Service',
  'Ingress',
  'ConfigMap',
  'Secret',
  'PersistentVolumeClaim',
  'PersistentVolume',
  'Namespace',
])

function buildRelationLink(kind: string, name: string, namespace?: string) {
  const route = RESOURCE_ROUTE_MAP[kind]
  if (!route || !SUPPORTED_SELECTION_KINDS.has(kind)) {
    return null
  }
  const params = new URLSearchParams()
  params.set('selection', name)
  if (namespace) {
    params.set('namespace', namespace)
  }
  const query = params.toString()
  return `/resources/${route}${query ? `?${query}` : ''}`
}

function createRelation({
  id,
  kind,
  name,
  namespace,
  href,
  copyValue,
  disabled,
}: {
  id: string
  kind: string
  name: string
  namespace?: string
  href?: string | null
  copyValue?: string
  disabled?: boolean
}): ResourceRelation {
  return {
    id,
    kind,
    label: name,
    namespace,
    href: href ?? undefined,
    copyValue,
    disabled,
  }
}

type RawVolume = {
  persistentVolumeClaim?: { claimName?: string }
  configMap?: { name?: string }
  secret?: { secretName?: string }
}

function extractVolumeRelations(raw: unknown, namespace: string) {
  const relations: ResourceRelation[] = []
  const volumes =
    (raw as { spec?: { volumes?: RawVolume[] } })?.spec?.volumes ?? []
  volumes.forEach((volume) => {
    const pvcName = volume?.persistentVolumeClaim?.claimName
    if (pvcName) {
      const href = buildRelationLink(
        'PersistentVolumeClaim',
        pvcName,
        namespace,
      )
      relations.push(
        createRelation({
          id: `pvc-${pvcName}`,
          kind: 'PersistentVolumeClaim',
          name: pvcName,
          namespace,
          copyValue: pvcName,
          href,
          disabled: !href,
        }),
      )
    }
    const configMapName = volume?.configMap?.name
    if (configMapName) {
      const href = buildRelationLink('ConfigMap', configMapName, namespace)
      relations.push(
        createRelation({
          id: `configmap-${configMapName}`,
          kind: 'ConfigMap',
          name: configMapName,
          namespace,
          copyValue: configMapName,
          href,
          disabled: !href,
        }),
      )
    }
    const secretName = volume?.secret?.secretName
    if (secretName) {
      const href = buildRelationLink('Secret', secretName, namespace)
      relations.push(
        createRelation({
          id: `secret-${secretName}`,
          kind: 'Secret',
          name: secretName,
          namespace,
          copyValue: secretName,
          href,
          disabled: !href,
        }),
      )
    }
  })
  return relations
}

export function formatLabelSelector(selector?: Record<string, string> | null) {
  if (!selector || Object.keys(selector).length === 0) return ''
  return Object.entries(selector)
    .map(([key, value]) => `${key}=${value}`)
    .join(',')
}

export function buildPodRelations(summary?: PodDetail, raw?: unknown) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  const owner = summary.owner
  if (owner?.name) {
    const href = buildRelationLink(owner.kind, owner.name, summary.namespace)
    relations.push(
      createRelation({
        id: `owner-${owner.kind}-${owner.name}`,
        kind: owner.kind,
        name: owner.name,
        namespace: summary.namespace,
        href,
        copyValue: owner.name,
        disabled: !href,
      }),
    )
  }
  if (summary.nodeName) {
    const href = buildRelationLink('Node', summary.nodeName)
    relations.push(
      createRelation({
        id: `node-${summary.nodeName}`,
        kind: 'Node',
        name: summary.nodeName,
        href,
        copyValue: summary.nodeName,
        disabled: !href,
      }),
    )
  }
  relations.push(...extractVolumeRelations(raw, summary.namespace))
  return dedupeRelations(relations)
}

export function buildDeploymentRelations(
  summary?: DeploymentDetail,
  raw?: unknown,
) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  const owner = summary.owner
  if (owner?.name) {
    const href = buildRelationLink(owner.kind, owner.name, summary.namespace)
    relations.push(
      createRelation({
        id: `owner-${owner.kind}-${owner.name}`,
        kind: owner.kind,
        name: owner.name,
        namespace: summary.namespace,
        href,
        copyValue: owner.name,
        disabled: !href,
      }),
    )
  }
  const podRelations = (summary.pods ?? []).slice(0, 6).map((pod) =>
    createRelation({
      id: `pod-${pod.namespace}-${pod.name}`,
      kind: 'Pod',
      name: pod.name,
      namespace: pod.namespace,
      href: buildRelationLink('Pod', pod.name, pod.namespace),
      copyValue: pod.name,
      disabled: false,
    }),
  )
  relations.push(...podRelations)
  relations.push(...extractVolumeRelations(raw, summary.namespace))
  return dedupeRelations(relations)
}

export function buildNodeRelations(summary?: NodeDetail, pods?: PodSummary[]) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  const podRelations = (pods ?? []).slice(0, 10).map((pod) =>
    createRelation({
      id: `pod-${pod.namespace}-${pod.name}`,
      kind: 'Pod',
      name: pod.name,
      namespace: pod.namespace,
      href: buildRelationLink('Pod', pod.name, pod.namespace),
      copyValue: pod.name,
      disabled: false,
    }),
  )
  relations.push(...podRelations)
  const namespaces = Array.from(
    new Set((pods ?? []).map((pod) => pod.namespace)),
  )
  namespaces.slice(0, 5).forEach((ns) => {
    relations.push(
      createRelation({
        id: `namespace-${ns}`,
        kind: 'Namespace',
        name: ns,
        namespace: ns,
        copyValue: ns,
        disabled: true,
      }),
    )
  })
  return dedupeRelations(relations)
}

export function buildStatefulSetRelations(
  summary?: StatefulSetDetail,
  pods?: PodSummary[],
) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  if (summary.serviceName) {
    const href = buildRelationLink(
      'Service',
      summary.serviceName,
      summary.namespace,
    )
    relations.push(
      createRelation({
        id: `service-${summary.serviceName}`,
        kind: 'Service',
        name: summary.serviceName,
        namespace: summary.namespace,
        href,
        copyValue: summary.serviceName,
        disabled: !href,
      }),
    )
  }
  const podRelations = (pods ?? []).slice(0, 8).map((pod) =>
    createRelation({
      id: `pod-${pod.namespace}-${pod.name}`,
      kind: 'Pod',
      name: pod.name,
      namespace: pod.namespace,
      href: buildRelationLink('Pod', pod.name, pod.namespace),
      copyValue: pod.name,
      disabled: false,
    }),
  )
  relations.push(...podRelations)
  summary.volumeClaims.forEach((claim) => {
    relations.push(
      createRelation({
        id: `pvc-template-${claim.name}`,
        kind: 'PersistentVolumeClaim',
        name: `${claim.name} (template)`,
        namespace: summary.namespace,
        copyValue: claim.name,
        disabled: true,
      }),
    )
  })
  return dedupeRelations(relations)
}

export function buildDaemonSetRelations(
  summary?: DaemonSetDetail,
  pods?: PodSummary[],
) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  const podRelations = (pods ?? []).slice(0, 10).map((pod) =>
    createRelation({
      id: `pod-${pod.namespace}-${pod.name}`,
      kind: 'Pod',
      name: pod.name,
      namespace: pod.namespace,
      href: buildRelationLink('Pod', pod.name, pod.namespace),
      copyValue: pod.name,
      disabled: false,
    }),
  )
  relations.push(...podRelations)
  const nodes = Array.from(
    new Set(
      (pods ?? []).map((pod) => pod.nodeName).filter(Boolean) as string[],
    ),
  )
  nodes.slice(0, 5).forEach((nodeName) => {
    const href = buildRelationLink('Node', nodeName)
    relations.push(
      createRelation({
        id: `node-${nodeName}`,
        kind: 'Node',
        name: nodeName,
        href,
        copyValue: nodeName,
        disabled: !href,
      }),
    )
  })
  return dedupeRelations(relations)
}

export function buildJobRelations(
  summary?: JobDetail,
  pods?: PodSummary[],
  raw?: unknown,
) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  const ownerRefs =
    (
      raw as {
        metadata?: { ownerReferences?: Array<{ kind?: string; name?: string }> }
      }
    )?.metadata?.ownerReferences ?? []
  ownerRefs
    .filter((owner) => owner.kind === 'CronJob' && owner.name)
    .forEach((owner) => {
      const href = buildRelationLink('CronJob', owner.name!, summary.namespace)
      relations.push(
        createRelation({
          id: `owner-${owner.kind}-${owner.name}`,
          kind: 'CronJob',
          name: owner.name!,
          namespace: summary.namespace,
          href,
          copyValue: owner.name!,
          disabled: !href,
        }),
      )
    })
  const podRelations = (pods ?? []).slice(0, 8).map((pod) =>
    createRelation({
      id: `pod-${pod.namespace}-${pod.name}`,
      kind: 'Pod',
      name: pod.name,
      namespace: pod.namespace,
      href: buildRelationLink('Pod', pod.name, pod.namespace),
      copyValue: pod.name,
      disabled: false,
    }),
  )
  relations.push(...podRelations)
  return dedupeRelations(relations)
}

export function buildCronJobRelations(
  summary?: CronJobDetail,
  jobs?: JobSummary[],
) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  const jobRelations = (jobs ?? []).slice(0, 6).map((job) =>
    createRelation({
      id: `job-${job.namespace}-${job.name}`,
      kind: 'Job',
      name: job.name,
      namespace: job.namespace,
      href: buildRelationLink('Job', job.name, job.namespace),
      copyValue: job.name,
      disabled: false,
    }),
  )
  relations.push(...jobRelations)
  relations.push(
    createRelation({
      id: `namespace-${summary.namespace}`,
      kind: 'Namespace',
      name: summary.namespace,
      namespace: summary.namespace,
      copyValue: summary.namespace,
      disabled: true,
    }),
  )
  return dedupeRelations(relations)
}

export function buildServiceRelations(summary?: ServiceDetail) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  ;(summary.endpoints ?? []).slice(0, 10).forEach((endpoint, index) => {
    if (endpoint.target?.kind === 'Pod' && endpoint.target.name) {
      relations.push(
        createRelation({
          id: `endpoint-${endpoint.target.uid}-${index}`,
          kind: 'Pod',
          name: endpoint.target.name,
          namespace: summary.namespace,
          href: buildRelationLink(
            'Pod',
            endpoint.target.name,
            summary.namespace,
          ),
          copyValue: endpoint.target.name,
          disabled: false,
        }),
      )
    }
  })
  if (summary.selector && Object.keys(summary.selector).length > 0) {
    relations.push(
      createRelation({
        id: `selector-${summary.name}`,
        kind: 'Selector',
        name: Object.entries(summary.selector)
          .map(([key, value]) => `${key}=${value}`)
          .join(', '),
        namespace: summary.namespace,
        copyValue: Object.entries(summary.selector)
          .map(([key, value]) => `${key}=${value}`)
          .join(','),
        disabled: true,
      }),
    )
  }
  return dedupeRelations(relations)
}

export function buildIngressRelations(summary?: IngressDetail) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  summary.rules.forEach((rule) => {
    rule.paths.forEach((path, index) => {
      const backend = path.backend?.split(':')[0]
      if (backend) {
        const href = buildRelationLink('Service', backend, summary.namespace)
        relations.push(
          createRelation({
            id: `service-${backend}-${index}`,
            kind: 'Service',
            name: backend,
            namespace: summary.namespace,
            href,
            copyValue: backend,
            disabled: !href,
          }),
        )
      }
    })
  })
  if (summary.defaultBackend) {
    const backend = summary.defaultBackend.split(':')[0]
    const href = backend
      ? buildRelationLink('Service', backend, summary.namespace)
      : null
    relations.push(
      createRelation({
        id: 'default-backend',
        kind: 'Service',
        name: backend ?? summary.defaultBackend,
        namespace: summary.namespace,
        href,
        copyValue: backend ?? summary.defaultBackend,
        disabled: !href,
      }),
    )
  }
  summary.tls.forEach((entry, index) => {
    if (entry.secretName) {
      relations.push(
        createRelation({
          id: `secret-${entry.secretName}-${index}`,
          kind: 'Secret',
          name: entry.secretName,
          namespace: summary.namespace,
          href: buildRelationLink(
            'Secret',
            entry.secretName,
            summary.namespace,
          ),
          copyValue: entry.secretName,
          disabled: false,
        }),
      )
    }
  })
  return dedupeRelations(relations)
}

export function buildPVCRelations(summary?: PVCDetail) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  if (summary.volumeName) {
    const href = buildRelationLink('PersistentVolume', summary.volumeName)
    relations.push(
      createRelation({
        id: `pv-${summary.volumeName}`,
        kind: 'PersistentVolume',
        name: summary.volumeName,
        href,
        copyValue: summary.volumeName,
        disabled: !href,
      }),
    )
  }
  relations.push(
    createRelation({
      id: 'namespace',
      kind: 'Namespace',
      name: summary.namespace,
      namespace: summary.namespace,
      copyValue: summary.namespace,
      disabled: true,
    }),
  )
  return dedupeRelations(relations)
}

export function buildPVRelations(summary?: PVDetail) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  if (summary.claimRef?.name) {
    const href = buildRelationLink(
      'PersistentVolumeClaim',
      summary.claimRef.name,
      summary.claimRef.namespace,
    )
    relations.push(
      createRelation({
        id: `pvc-${summary.claimRef.namespace ?? 'cluster'}-${summary.claimRef.name}`,
        kind: 'PersistentVolumeClaim',
        name: summary.claimRef.name,
        namespace: summary.claimRef.namespace,
        href,
        copyValue: summary.claimRef.name,
        disabled: !href,
      }),
    )
  }
  return dedupeRelations(relations)
}

export function buildNamespaceRelations(summary?: NamespaceDetail) {
  if (!summary) return []
  const relations: ResourceRelation[] = []
  const resourceKinds = [
    { kind: 'Pods', route: 'pods' },
    { kind: 'Deployments', route: 'deployments' },
    { kind: 'StatefulSets', route: 'statefulsets' },
    { kind: 'DaemonSets', route: 'daemonsets' },
    { kind: 'Services', route: 'services' },
    { kind: 'ConfigMaps', route: 'configmaps' },
    { kind: 'Secrets', route: 'secrets' },
    { kind: 'PVCs', route: 'pvcs' },
    { kind: 'Jobs', route: 'jobs' },
    { kind: 'CronJobs', route: 'cronjobs' },
  ]

  resourceKinds.forEach((entry) => {
    relations.push(
      createRelation({
        id: `ns-${summary.name}-${entry.route}`,
        kind: entry.kind,
        name: summary.name,
        namespace: summary.name,
        href: `/resources/${entry.route}?namespace=${encodeURIComponent(summary.name)}`,
        copyValue: summary.name,
        disabled: false,
      }),
    )
  })
  return dedupeRelations(relations)
}

function dedupeRelations(relations: ResourceRelation[]) {
  const seen = new Set<string>()
  return relations.filter((relation) => {
    if (seen.has(relation.id)) {
      return false
    }
    seen.add(relation.id)
    return true
  })
}
