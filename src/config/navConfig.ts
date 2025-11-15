import {
  Activity,
  AlarmClock,
  AlertTriangle,
  Bot,
  Box,
  CalendarDays,
  ClipboardList,
  Code2,
  Database,
  FileText,
  Gauge,
  History,
  HardDrive,
  Home,
  Layers3,
  ListChecks,
  Lock,
  Network,
  RouteIcon,
  Server,
  ServerCog,
  ServerCrash,
  ScrollText,
} from 'lucide-react'
import { type SidebarNavConfig } from './navigation'
import { resourceNavGroups } from './resourceNavGroups'

type LucideIcon = typeof AlarmClock

const resourceGroupIcons: Record<string, LucideIcon> = {
  Workloads: Box,
  Networking: Network,
  'Config & Storage': FileText,
  Cluster: Server,
}

const resourceItemIcons: Record<string, LucideIcon> = {
  pods: Box,
  deployments: ServerCog,
  statefulsets: Layers3,
  daemonsets: RouteIcon,
  jobs: ListChecks,
  cronjobs: AlarmClock,
  services: Network,
  ingresses: RouteIcon,
  configmaps: FileText,
  secrets: Lock,
  pvcs: HardDrive,
  pvs: Database,
  nodes: ServerCog,
  namespaces: ServerCrash,
}

export const navConfig: SidebarNavConfig = [
  {
    title: 'SRE Mission Control',
    items: [
      {
        label: 'Health',
        icon: Activity,
        children: [
          { href: '/', label: 'Overview', icon: Home },
          { href: '/events', label: 'Events', icon: CalendarDays },
          {
            href: '/ai-diagnosis',
            label: 'Cluster Alerts / AI Diagnosis',
            icon: AlertTriangle,
          },
        ],
      },
      {
        label: 'App Runtime',
        icon: Server,
        children: [
          { href: '/pods', label: 'Pods', icon: Box },
          { href: '/deployments', label: 'Deployments', icon: ServerCog },
          { href: '/statefulsets', label: 'StatefulSets', icon: Layers3 },
          { href: '/daemonsets', label: 'DaemonSets', icon: RouteIcon },
          { href: '/jobs', label: 'Jobs', icon: ListChecks },
          { href: '/cronjobs', label: 'CronJobs', icon: AlarmClock },
        ],
      },
      {
        label: 'Platform',
        icon: Layers3,
        children: [
          { href: '/configmaps', label: 'ConfigMaps', icon: FileText },
          { href: '/secrets', label: 'Secrets', icon: Lock },
          { href: '/services', label: 'Services', icon: Network },
          { href: '/ingresses', label: 'Ingresses', icon: RouteIcon },
          { href: '/pvcs', label: 'PVCs', icon: HardDrive },
          { href: '/pvs', label: 'PVs', icon: Database },
        ],
      },
      {
        label: 'Infra',
        icon: ServerCrash,
        children: [
          { href: '/nodes', label: 'Nodes', icon: ServerCog },
          { href: '/namespaces', label: 'Namespaces', icon: ServerCrash },
        ],
      },
    ],
  },
  {
    title: 'Dashboards',
    items: [
      { href: '/', label: 'Overview', icon: Home },
      { href: '/dashboards/cluster', label: 'Node Dashboard', icon: Gauge },
      { href: '/dashboards/workloads', label: 'Workload Dashboard', icon: Box },
      {
        href: '/dashboards/network',
        label: 'Network Dashboard',
        icon: Network,
      },
      {
        href: '/dashboards/storage',
        label: 'Storage Dashboard',
        icon: Database,
      },
    ],
  },
  {
    title: 'Resources',
    description: 'Raw Kubernetes Explorer',
    items: resourceNavGroups.map((group) => ({
      label: group.title,
      icon: resourceGroupIcons[group.title] ?? Box,
      children: group.items.map((item) => ({
        href: `/resources/${item.slug}`,
        label: item.label,
        icon: resourceItemIcons[item.slug] ?? Box,
      })),
    })),
  },
  {
    title: 'AI Copilot',
    items: [
      {
        href: '/operation-plans',
        label: 'Operation Plans',
        icon: ClipboardList,
      },
      {
        href: '/yaml-copilot',
        label: 'YAML Copilot',
        icon: Code2,
      },
      {
        href: '/ask-cluster',
        label: 'Ask the Cluster',
        icon: Bot,
      },
    ],
  },
  {
    title: 'Audit',
    items: [
      { href: '/audit/operations', label: 'Operation History', icon: History },
      { href: '/audit/api-logs', label: 'API Logs', icon: ScrollText },
      { href: '/audit/events', label: 'Audit Events', icon: CalendarDays },
    ],
  },
]
