'use client'

import { useTransition, type ComponentProps } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

import { Button } from '@ui-kit/button'

type ResourceRefreshButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'>

export function ResourceRefreshButton({
  children,
  disabled,
  className,
  ...props
}: ResourceRefreshButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (isPending) return
    startTransition(() => router.refresh())
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={disabled || isPending}
      onClick={handleClick}
      {...props}
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
      />
      {children ?? 'Refresh'}
    </Button>
  )
}
