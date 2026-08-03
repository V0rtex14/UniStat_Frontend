import type {
  CampusBuildings,
  LightingProduct,
  Room,
  Tariff,
  SensorDetailed,
  CatalogData,
  UsefulCatalogData,
  MonitoringAnalytics,
} from "@/lib/types"

// Static/config data always comes from JSON files regardless of data mode.

export async function fetchCampusBuildings(): Promise<CampusBuildings> {
  const response = await fetch("/data/campus_buildings.json")
  if (!response.ok) throw new Error("Failed to load campus buildings")
  return response.json()
}

export async function fetchLightingProducts(): Promise<LightingProduct[]> {
  const response = await fetch("/data/lighting_products.json")
  if (!response.ok) throw new Error("Failed to load lighting products")
  return response.json()
}

export async function fetchRooms(): Promise<Room[]> {
  const response = await fetch("/data/rooms.json")
  if (!response.ok) throw new Error("Failed to load rooms")
  return response.json()
}

export async function fetchTariffs(): Promise<Tariff> {
  const response = await fetch("/data/tariffs.json")
  if (!response.ok) throw new Error("Failed to load tariffs")
  return response.json()
}

export async function fetchSensorsDetailed(): Promise<SensorDetailed[]> {
  const response = await fetch("/data/sensors_detailed.json")
  if (!response.ok) throw new Error("Failed to load sensors")
  return response.json()
}

export async function fetchCatalogEquipment(): Promise<CatalogData> {
  const response = await fetch("/data/catalog_equipment.json")
  if (!response.ok) throw new Error("Failed to load catalog equipment")
  return response.json()
}

export async function fetchCatalogUseful(): Promise<UsefulCatalogData> {
  const response = await fetch("/data/catalog_useful.json")
  if (!response.ok) throw new Error("Failed to load useful catalog")
  return response.json()
}

export async function fetchMonitoringAnalytics(): Promise<MonitoringAnalytics> {
  const response = await fetch("/data/monitoring_analytics.json")
  if (!response.ok) throw new Error("Failed to load monitoring analytics")
  return response.json()
}
