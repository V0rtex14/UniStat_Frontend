export interface AppConfig {
  apiBaseUrl: string
  dataMode: "auto" | "api" | "json"
  apiTimeoutMs: number
  apiHealthCheckIntervalMs: number
  sensorPollIntervalMs: number
}

function getConfig(): AppConfig {
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_ESP32_API_URL ?? "",
    dataMode: (process.env.NEXT_PUBLIC_DATA_MODE as AppConfig["dataMode"]) ?? "auto",
    apiTimeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? "3000"),
    apiHealthCheckIntervalMs: Number(process.env.NEXT_PUBLIC_API_HEALTH_CHECK_INTERVAL_MS ?? "30000"),
    sensorPollIntervalMs: Number(process.env.NEXT_PUBLIC_SENSOR_POLL_INTERVAL_MS ?? "30000"),
  }
}

export const config = getConfig()
