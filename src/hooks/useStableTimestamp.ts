'use client'

import { useEffect, useState } from 'react'

const UNKNOWN = 'Unknown'

export function useStableTimestamp(
  value?: string | null,
  fallback: string = UNKNOWN,
) {
  const [display, setDisplay] = useState(() => {
    if (!value) return fallback
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return date.toISOString()
  })

  const [iso, setIso] = useState(() => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  })

  useEffect(() => {
    if (!value) {
      setDisplay(fallback)
      setIso(null)
      return
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      setDisplay(value)
      setIso(null)
      return
    }

    setDisplay(date.toLocaleString())
    setIso(date.toISOString())
  }, [value, fallback])

  return { display, iso }
}
