import { config } from "@/lib/config"
import { getCachedStatus } from "@/lib/services/data-source"
import type { DashboardMetrics } from "@/lib/types"

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const status = getCachedStatus()

  if (status.mode === "api" && status.apiUrl) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeoutMs)
    try {
      const response = await fetch(`${status.apiUrl}/api/dashboard`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      return response.json()
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  const response = await fetch("/data/monitoring_zero.json")
  if (!response.ok) throw new Error("Dashboard metrics file not found")
  return response.json()
}
