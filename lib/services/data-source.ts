import { config } from "@/lib/config"
import type { DataSourceStatus } from "@/lib/types"

let cachedStatus: DataSourceStatus = {
  mode: "json",
  apiUrl: config.apiBaseUrl || null,
  lastChecked: 0,
  isOnline: false,
}

export async function detectDataSource(): Promise<DataSourceStatus> {
  if (!config.apiBaseUrl || config.dataMode === "json") {
    cachedStatus = {
      mode: "json",
      apiUrl: null,
      lastChecked: Date.now(),
      isOnline: false,
    }
    return cachedStatus
  }

  if (config.dataMode === "api") {
    cachedStatus = {
      mode: "api",
      apiUrl: config.apiBaseUrl,
      lastChecked: Date.now(),
      isOnline: true,
    }
    return cachedStatus
  }

  // Auto mode: probe the health endpoint
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeoutMs)

    const response = await fetch(`${config.apiBaseUrl}/api/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      cachedStatus = {
        mode: "api",
        apiUrl: config.apiBaseUrl,
        lastChecked: Date.now(),
        isOnline: true,
      }
    } else {
      throw new Error(`Health check returned ${response.status}`)
    }
  } catch {
    cachedStatus = {
      mode: "json",
      apiUrl: config.apiBaseUrl,
      lastChecked: Date.now(),
      isOnline: false,
    }
  }

  return cachedStatus
}

export function getCachedStatus(): DataSourceStatus {
  return cachedStatus
}

export function shouldRecheck(): boolean {
  return Date.now() - cachedStatus.lastChecked > config.apiHealthCheckIntervalMs
}
