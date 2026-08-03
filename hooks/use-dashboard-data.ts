"use client"

import { useState, useEffect } from "react"
import { config } from "@/lib/config"
import { fetchDashboardMetrics } from "@/lib/services/dashboard-service"
import { getCachedStatus } from "@/lib/services/data-source"
import type { DashboardMetrics, DataSourceMode } from "@/lib/types"

interface UseDashboardDataResult {
  data: DashboardMetrics | null
  isLoading: boolean
  error: string | null
  dataSource: DataSourceMode
}

export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const result = await fetchDashboardMetrics()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Poll only in API mode
    if (getCachedStatus().mode === "api") {
      const id = setInterval(fetchData, config.sensorPollIntervalMs)
      return () => clearInterval(id)
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    dataSource: getCachedStatus().mode,
  }
}
