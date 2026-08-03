"use client"

import { useState, useEffect, useCallback } from "react"
import { detectDataSource, getCachedStatus, shouldRecheck } from "@/lib/services/data-source"
import type { DataSourceStatus } from "@/lib/types"

export function useDataSource() {
  const [status, setStatus] = useState<DataSourceStatus>(getCachedStatus())
  const [isDetecting, setIsDetecting] = useState(true)

  const detect = useCallback(async () => {
    setIsDetecting(true)
    const result = await detectDataSource()
    setStatus(result)
    setIsDetecting(false)
  }, [])

  useEffect(() => {
    detect()

    const interval = setInterval(() => {
      if (shouldRecheck()) {
        detect()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [detect])

  return { status, isDetecting, recheck: detect }
}
