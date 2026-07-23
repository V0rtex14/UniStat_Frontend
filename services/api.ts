import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface TelemetryData {
  temp: number
  humidity: number
  co2: number
  pm25: number
  lux: number
  powerKw: number
  ts: number
}

export interface DeviceState {
  ventilation: boolean
  sockets: boolean
  lightGroups: number
  manualOverride: boolean
}

export interface RoomInfo {
  id: string
  name: string
  temp: number
  humidity: number
  co2: number
  pm25: number
  lux: number
  powerKw: number
  devices: DeviceState
}

const DEFAULT_ROOM: RoomInfo = {
  id: "room-1",
  name: "Главная аудитория / Комната",
  temp: 22.4,
  humidity: 45.0,
  co2: 580,
  pm25: 12,
  lux: 350,
  powerKw: 1.25,
  devices: {
    ventilation: true,
    sockets: true,
    lightGroups: 3,
    manualOverride: false,
  },
}

export async function getTelemetry(): Promise<TelemetryData> {
  try {
    const res = await client.get("/telemetry")
    return res.data
  } catch {
    return {
      temp: DEFAULT_ROOM.temp,
      humidity: DEFAULT_ROOM.humidity,
      co2: DEFAULT_ROOM.co2,
      pm25: DEFAULT_ROOM.pm25,
      lux: DEFAULT_ROOM.lux,
      powerKw: DEFAULT_ROOM.powerKw,
      ts: Date.now(),
    }
  }
}

export async function getTelemetryHistory(): Promise<TelemetryData[]> {
  try {
    const res = await client.get("/telemetry/history")
    return res.data
  } catch {
    const now = Date.now()
    return Array.from({ length: 12 }, (_, i) => ({
      temp: 21 + Math.sin(i) * 2,
      humidity: 40 + (i % 5) * 2,
      co2: 500 + i * 25,
      pm25: 10 + i,
      lux: 300 + i * 15,
      powerKw: 1.1 + (i % 3) * 0.2,
      ts: now - (11 - i) * 3600 * 1000,
    }))
  }
}

export async function sendDeviceCommand(command: Partial<DeviceState>): Promise<DeviceState> {
  try {
    const res = await client.post("/devices/control", command)
    return res.data
  } catch {
    return {
      ...DEFAULT_ROOM.devices,
      ...command,
    }
  }
}

export async function getDeviceState(): Promise<DeviceState> {
  try {
    const res = await client.get("/devices/state")
    return res.data
  } catch {
    return DEFAULT_ROOM.devices
  }
}
