"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getTelemetry,
  getTelemetryHistory,
  getDeviceState,
  sendDeviceCommand,
  TelemetryData,
  DeviceState,
} from "@/services/api"

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [history, setHistory] = useState<TelemetryData[]>([])
  const [devices, setDevices] = useState<DeviceState>({
    ventilation: true,
    sockets: true,
    lightGroups: 3,
    manualOverride: false,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [isOnline, setIsOnline] = useState<boolean>(false)

  const refreshData = useCallback(async () => {
    try {
      const [latest, hist, dev] = await Promise.all([
        getTelemetry(),
        getTelemetryHistory(),
        getDeviceState(),
      ])
      setTelemetry(latest)
      setHistory(hist)
      setDevices(dev)
      setIsOnline(true)
    } catch {
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
    const timer = setInterval(refreshData, 30000)
    return () => clearInterval(timer)
  }, [refreshData])

  const toggleVentilation = async () => {
    const updated = await sendDeviceCommand({ ventilation: !devices.ventilation })
    setDevices(updated)
  }

  const toggleSockets = async () => {
    const updated = await sendDeviceCommand({ sockets: !devices.sockets })
    setDevices(updated)
  }

  const setLightGroups = async (level: number) => {
    const updated = await sendDeviceCommand({ lightGroups: level })
    setDevices(updated)
  }

  return {
    telemetry,
    history,
    devices,
    loading,
    isOnline,
    refreshData,
    toggleVentilation,
    toggleSockets,
    setLightGroups,
  }
}
