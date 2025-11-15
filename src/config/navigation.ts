import { type LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  href?: string
  icon?: LucideIcon
  children?: NavItem[]
}

export type NavSection = {
  title: string
  description?: string
  items: NavItem[]
}

export type SidebarNavConfig = NavSection[]
