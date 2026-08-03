import { config } from "@/lib/config"
import { getCachedStatus } from "@/lib/services/data-source"
import type { RoomSensorData, RoomManifest } from "@/lib/types"

export async function fetchRoomSensorData(roomId: string): Promise<RoomSensorData> {
  const status = getCachedStatus()

  if (status.mode === "api" && status.apiUrl) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeoutMs)
    try {
      const response = await fetch(`${status.apiUrl}/api/sensors/${roomId}`, {
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

  const response = await fetch(`/data/monitoring/${roomId}.json`)
  if (!response.ok) throw new Error(`JSON file not found: ${roomId}`)
  return response.json()
}

export async function fetchFloorSensorData(
  building: string,
  floor: number
): Promise<RoomSensorData[]> {
  const status = getCachedStatus()

  if (status.mode === "api" && status.apiUrl) {
    const params = new URLSearchParams({ building, floor: String(floor) })
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeoutMs)
    try {
      const response = await fetch(`${status.apiUrl}/api/sensors?${params}`, {
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

  // JSON fallback: read manifest, then fetch each matching room
  const manifestResponse = await fetch("/data/monitoring/manifest.json")
  if (!manifestResponse.ok) throw new Error("Room manifest not found")
  const manifest: RoomManifest = await manifestResponse.json()

  const matchingRooms = manifest.rooms.filter(
    (r) => r.building === building && r.floor === floor
  )

  const results = await Promise.all(
    matchingRooms.map((r) =>
      fetch(`/data/monitoring/${r.room_id}.json`)
        .then((res) => {
          if (!res.ok) return null
          return res.json() as Promise<RoomSensorData>
        })
        .catch(() => null)
    )
  )

  return results.filter((r): r is RoomSensorData => r !== null)
}

export async function fetchAllSensorData(): Promise<RoomSensorData[]> {
  const status = getCachedStatus()

  if (status.mode === "api" && status.apiUrl) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeoutMs)
    try {
      const response = await fetch(`${status.apiUrl}/api/sensors/all`, {
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

  const manifestResponse = await fetch("/data/monitoring/manifest.json")
  if (!manifestResponse.ok) throw new Error("Room manifest not found")
  const manifest: RoomManifest = await manifestResponse.json()

  const results = await Promise.all(
    manifest.rooms.map((r) =>
      fetch(`/data/monitoring/${r.room_id}.json`)
        .then((res) => {
          if (!res.ok) return null
          return res.json() as Promise<RoomSensorData>
        })
        .catch(() => null)
    )
  )

  return results.filter((r): r is RoomSensorData => r !== null)
}
