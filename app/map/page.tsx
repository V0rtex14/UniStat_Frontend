"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, Thermometer, Wind, Droplets, X, Building2 } from "lucide-react"
import { useConfigData } from "@/hooks/use-config-data"
import { useSensorData } from "@/hooks/use-sensor-data"
import { fetchCampusBuildings } from "@/lib/services/config-service"
import type { RoomSensorData } from "@/lib/types"

export default function MapPage() {
  const { data: campusData } = useConfigData(fetchCampusBuildings)
  const buildings = campusData?.buildings ?? []

  const [selectedBuilding, setSelectedBuilding] = useState<string>("B1")
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [selectedRoom, setSelectedRoom] = useState<RoomSensorData | null>(null)

  const { data: currentBuildingData, dataSource } = useSensorData(selectedBuilding, selectedFloor)

  const getCO2Status = (level: number) => {
    if (level < 600) return { color: "text-success", label: "Отлично" }
    if (level < 800) return { color: "text-warning", label: "Хорошо" }
    return { color: "text-destructive", label: "Требуется вентиляция" }
  }

  const currentBuilding = buildings.find((b) => b.id === selectedBuilding)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Карта кампуса КГТУ им. Раззакова</h1>
          <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
            Интерактивная карта корпусов с мониторингом датчиков в реальном времени
          </p>
        </div>

        {/* Building and Floor Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <Label className="text-sm font-medium mb-2 block">Выберите корпус:</Label>
                <div className="flex gap-2">
                  {buildings.map((building) => (
                    <Button
                      key={building.id}
                      variant={selectedBuilding === building.id ? "default" : "outline"}
                      onClick={() => {
                        setSelectedBuilding(building.id)
                        setSelectedFloor(1)
                        setSelectedRoom(null)
                      }}
                      className="gap-2"
                    >
                      <Building2 className="h-4 w-4" />
                      {building.name_ru}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-l border-border pl-4">
                <Label className="text-sm font-medium mb-2 block">Выберите этаж:</Label>
                <div className="flex gap-2">
                  {currentBuilding &&
                    Array.from({ length: currentBuilding.floors }, (_, i) => i + 1).map((floor) => (
                      <Button
                        key={floor}
                        variant={selectedFloor === floor ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedFloor(floor)
                          setSelectedRoom(null)
                        }}
                      >
                        {floor}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {currentBuilding?.name_ru} - Этаж {selectedFloor}
                </h2>
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span>Активный</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                    <span>Нет данных</span>
                  </div>
                </div>
              </div>

              {/* SVG Floor Plan */}
              <div className="bg-muted/30 rounded-lg p-8">
                <svg viewBox="0 0 800 400" className="w-full h-auto">
                  {/* Floor Plan Background */}
                  <rect x="50" y="50" width="700" height="300" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8" />

                  {/* Corridor */}
                  <rect x="70" y="180" width="660" height="60" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="400" y="215" textAnchor="middle" className="text-sm" fill="#64748b">
                    Коридор
                  </text>

                  {/* Rooms - Top Row */}
                  {currentBuildingData.slice(0, 3).map((room, idx) => {
                    const x = 100 + idx * 200
                    const isSelected = selectedRoom?.room === room.room
                    return (
                      <g key={`top-${room.room}`} onClick={() => setSelectedRoom(room)} className="cursor-pointer">
                        <rect
                          x={x}
                          y="70"
                          width="160"
                          height="90"
                          fill={room ? "#3b82f6" : "#94a3b8"}
                          stroke={isSelected ? "#000" : "#cbd5e1"}
                          strokeWidth={isSelected ? "3" : "1"}
                          rx="4"
                          opacity="0.8"
                        />
                        <text x={x + 80} y="120" textAnchor="middle" className="text-base font-semibold" fill="white">
                          {room.room}
                        </text>
                      </g>
                    )
                  })}

                  {/* Rooms - Bottom Row */}
                  {currentBuildingData.slice(3, 6).map((room, idx) => {
                    const x = 100 + idx * 200
                    const isSelected = selectedRoom?.room === room.room
                    return (
                      <g key={`bottom-${room.room}`} onClick={() => setSelectedRoom(room)} className="cursor-pointer">
                        <rect
                          x={x}
                          y="260"
                          width="160"
                          height="70"
                          fill={room ? "#3b82f6" : "#94a3b8"}
                          stroke={isSelected ? "#000" : "#cbd5e1"}
                          strokeWidth={isSelected ? "3" : "1"}
                          rx="4"
                          opacity="0.8"
                        />
                        <text x={x + 80} y="300" textAnchor="middle" className="text-base font-semibold" fill="white">
                          {room.room}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              <div className="mt-4 text-xs text-muted-foreground text-center">
                Нажмите на помещение для просмотра данных датчиков
              </div>
            </Card>
          </div>

          {/* Room Details Panel */}
          <div>
            {selectedRoom ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Аудитория {selectedRoom.room}</CardTitle>
                      <CardDescription>
                        {currentBuilding?.name_ru}, Этаж {selectedRoom.floor}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sensor Data */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Освещенность</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedRoom.light_lux} люкс</div>
                      <div className="text-xs text-muted-foreground">Норма: 300-500 люкс для учебных помещений</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">Температура</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedRoom.temperature_c}°C</div>
                      <div className="text-xs text-muted-foreground">Оптимально: 20-22°C</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium">Влажность</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedRoom.humidity_percent}%</div>
                      <div className="text-xs text-muted-foreground">Оптимально: 40-60%</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Wind className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">Качество воздуха (CO₂)</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedRoom.co2_ppm} ppm</div>
                      <div className={`text-xs ${getCO2Status(selectedRoom.co2_ppm).color}`}>
                        {getCO2Status(selectedRoom.co2_ppm).label}
                      </div>
                    </div>
                  </div>

                  {/* Device Status */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="text-sm font-semibold">Состояние устройств</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Освещение</span>
                      <Badge variant={selectedRoom.light_lux > 0 ? "default" : "secondary"}>
                        {selectedRoom.light_lux > 0 ? "Включено" : "Выключено"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Датчики</span>
                      <Badge variant="default" className="bg-success text-white">
                        Активны
                      </Badge>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Последнее обновление: {new Date(selectedRoom.timestamp).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Lightbulb className="h-8 w-8" />
                  </div>
                  <p className="text-sm">Выберите помещение на карте</p>
                  <p className="text-xs mt-2">для просмотра данных датчиков</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
