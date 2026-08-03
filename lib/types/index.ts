// =============================================
// Data source
// =============================================
export type DataSourceMode = "api" | "json"

export interface DataSourceStatus {
  mode: DataSourceMode
  apiUrl: string | null
  lastChecked: number
  isOnline: boolean
}

// =============================================
// Sensor data (per-room, from ESP32 or per-room JSON)
// =============================================
export interface RoomSensorData {
  room_id: string
  building: string
  floor: number
  room: string
  timestamp: string
  temperature_c: number
  humidity_percent: number
  co2_ppm: number
  air_quality_index: number
  light_lux: number
}

// =============================================
// Dashboard aggregate metrics
// =============================================
export interface DashboardMetrics {
  current_energy_kwh: number
  current_power_kw: number
  lighting_energy_kwh: number
  lighting_share_percent: number
  heating_energy_kwh: number
  ventilation_energy_kwh: number
  other_energy_kwh: number
  average_temperature_celsius: number
  air_quality_index: number
  co2_ppm: number
  monthly_savings_kgs: number
  status: string
  last_updated: string | null
  explanation: string
}

// =============================================
// Building metadata (config data, always JSON)
// =============================================
export interface Building {
  id: string
  name: string
  name_ru: string
  floors: number
}

export interface CampusBuildings {
  campus: string
  buildings: Building[]
}

// =============================================
// Calculator config data (always JSON)
// =============================================
export interface LightingProduct {
  id: string
  type: string
  model: string
  manufacturer: string
  power_w: number
  luminous_flux_lm: number
  lifetime_hours: number
  price_kgs: number
  purchase_link: string
}

export interface Room {
  id: string
  building_id: string
  floor: number
  room_number: string
  name: string
  area_m2: number
  lamp_count: number
  lamp_type_id: string
  illumination_lux: number
  baseline_power_w: number
  room_type: string
}

export interface Tariff {
  electricity: {
    current_rate_kgs_per_kwh: number
    last_updated: string
    description: string
    source: string
  }
  heating: {
    cost_coefficient: number
    description: string
    unit: string
  }
}

// =============================================
// Architecture / Catalog (always JSON)
// =============================================
export interface SensorDetailed {
  id: string
  name: string
  type: string
  category: string
  manufacturer: string
  model: string
  connection_type: string
  wifi_capable: boolean
  interface: string
  pins: string[]
  specifications: Record<string, string | number>
  price_kgs: number
  purchase_links: string[]
  use_case: string
  benefits: string[]
  installation_guide: {
    required_components: string[]
    wiring: Record<string, string>
    software_setup: string
    estimated_time: string
    notes?: string
    configuration?: string
    safety_warning?: string
  }
  wifi_solution: {
    description: string
    recommended_board: string
    setup: string
  }
}

export interface Equipment {
  id: string
  name: string
  full_name: string
  manufacturer: string
  type: string
  interface: string
  price_usd: number
  price_kgs: number
  purchase_links: string[]
  specifications: Record<string, string>
  description: string
  advantages: string[]
  use_cases: string[]
  how_it_works: string
  important_note?: string
  energy_savings?: string
}

export interface CatalogData {
  temperature_humidity_sensors: Equipment[]
  light_sensors: Equipment[]
  air_quality_sensors: Equipment[]
}

export interface UsefulCatalogData {
  door_closers: Equipment[]
  led_lamps: Equipment[]
  motion_sensors: Equipment[]
  smart_sockets: Equipment[]
  smart_bulbs: Equipment[]
}

// =============================================
// Monitoring page analytics
// =============================================
export interface EnergyDistribution {
  total: number
  lighting: number
  heating: number
  ventilation: number
  other: number
}

export interface DailyTrend {
  hour: string
  value: number
}

export interface WeeklyComparison {
  day: string
  before: number
  after: number
}

export interface BuildingEnergy {
  name: string
  consumption: number
  savings: number
  status: string
}

export interface MonitoringAnalytics {
  current: EnergyDistribution
  trends: {
    daily: DailyTrend[]
    weekly: WeeklyComparison[]
  }
  buildings: BuildingEnergy[]
}

// =============================================
// Room manifest for per-room JSON loading
// =============================================
export interface RoomManifestEntry {
  room_id: string
  building: string
  floor: number
  room: string
}

export interface RoomManifest {
  rooms: RoomManifestEntry[]
}
