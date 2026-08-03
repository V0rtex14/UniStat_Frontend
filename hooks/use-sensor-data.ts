"use client"

import { useState, useEffect, useCallback } from "react"
import { config } from "@/lib/config"
import { fetchFloorSensorData } from "@/lib/services/sensor-service"
import { getCachedStatus } from "@/lib/services/data-source"
import type { RoomSensorData, DataSourceMode } from "@/lib/types"

interface UseSensorDataResult {
  data: RoomSensorData[]
  isLoading: boolean
  error: string | null
  dataSource: DataSourceMode
  refetch: () => void
}

export function useSensorData(building: string, floor: number): UseSensorDataResult {
  const [data, setData] = useState<RoomSensorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchFloorSensorData(building, floor)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [building, floor])

  useEffect(() => {
    setIsLoading(true)
    fetchData()

    // Poll only in API mode
    if (getCachedStatus().mode === "api") {
      const id = setInterval(fetchData, config.sensorPollIntervalMs)
      return () => clearInterval(id)
    }
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    dataSource: getCachedStatus().mode,
    refetch: fetchData,
  }
}
