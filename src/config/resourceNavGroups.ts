export type ResourceNavGroup = {
  title: string
  items: {
    slug: string
    label: string
  }[]
}

export const resourceNavGroups: ResourceNavGroup[] = [
  {
    title: 'Workloads',
    items: [
      { slug: 'pods', label: 'Pods' },
      { slug: 'deployments', label: 'Deployments' },
      { slug: 'statefulsets', label: 'StatefulSets' },
      { slug: 'daemonsets', label: 'DaemonSets' },
      { slug: 'jobs', label: 'Jobs' },
      { slug: 'cronjobs', label: 'CronJobs' },
    ],
  },
  {
    title: 'Networking',
    items: [
      { slug: 'services', label: 'Services' },
      { slug: 'ingresses', label: 'Ingresses' },
    ],
  },
  {
    title: 'Config & Storage',
    items: [
      { slug: 'configmaps', label: 'ConfigMaps' },
      { slug: 'secrets', label: 'Secrets' },
      { slug: 'pvcs', label: 'PVCs' },
      { slug: 'pvs', label: 'PVs' },
    ],
  },
  {
    title: 'Cluster',
    items: [
      { slug: 'nodes', label: 'Nodes' },
      { slug: 'namespaces', label: 'Namespaces' },
    ],
  },
]
