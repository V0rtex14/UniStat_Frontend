"use client"

import { useTelemetry } from "@/hooks/use-telemetry"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wind, Lightbulb, Zap, Activity, Power, Cpu,
  Thermometer, Droplets, Sun, AlertTriangle, RefreshCw, Radio,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip, ResponsiveContainer,
} from "recharts"

export default function DashboardPage() {
  const {
    telemetry,
    history,
    devices,
    loading,
    isOnline,
    refreshData,
    toggleVentilation,
    toggleSockets,
    setLightGroups,
  } = useTelemetry()

  const formattedChartData = history.map((item) => ({
    time: new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: item.temp,
    humidity: item.humidity,
    co2: item.co2,
    pm25: item.pm25,
    lux: item.lux,
  }))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            UniStat IoT Control Center
          </h1>
          <p className="text-slate-400 text-sm">
            Мониторинг параметров окружающей среды и управление исполнительными реле
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={
              isOnline
                ? "bg-emerald-950 text-emerald-400 border-emerald-800 flex items-center gap-1.5"
                : "bg-amber-950 text-amber-400 border-amber-800 flex items-center gap-1.5"
            }
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            {isOnline ? "Spring Backend Connected" : "Local Mock / Offline Mode"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Main Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature & Humidity */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Температура / Влажность</CardTitle>
            <Thermometer className="h-5 w-5 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {telemetry ? `${telemetry.temp.toFixed(1)} °C` : "--"}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-sky-400" />
              Влажность: {telemetry ? `${telemetry.humidity.toFixed(1)}%` : "--"}
            </div>
          </CardContent>
        </Card>

        {/* CO2 Air Quality */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Качество воздуха (eCO₂)</CardTitle>
            <Wind className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {telemetry ? `${telemetry.co2} ppm` : "--"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {telemetry && telemetry.co2 > 1000 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Требуется проветривание
                </span>
              ) : (
                <span className="text-emerald-400">Показатели в норме</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PM2.5 Smog & Dust */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Мелкая пыль (PM2.5)</CardTitle>
            <Cpu className="h-5 w-5 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {telemetry ? `${telemetry.pm25} µg/m³` : "--"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Норма: &lt; 35 µg/m³
            </div>
          </CardContent>
        </Card>

        {/* Illumination & Power */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Освещенность & Мощность</CardTitle>

            <Sun className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {telemetry ? `${telemetry.lux} Lux` : "--"}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Потребление: {telemetry ? `${telemetry.powerKw.toFixed(2)} кВт` : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Relays Section & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Relays Control Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Power className="h-5 w-5 text-indigo-400" />
              Управление силовыми реле (Wemos)
            </CardTitle>
            <CardDescription className="text-slate-400">
              Коммутация силовых блоков 30A по протоколу HTTP / REST
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Ventilation Relay */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Wind className={`h-5 w-5 ${devices.ventilation ? "text-emerald-400" : "text-slate-600"}`} />
                <div>
                  <div className="font-medium text-sm text-slate-200">Вентиляция / Очиститель</div>
                  <div className="text-xs text-slate-500">Реле 1 (30A)</div>
                </div>
              </div>
              <Button
                variant={devices.ventilation ? "default" : "outline"}
                size="sm"
                onClick={toggleVentilation}
                className={devices.ventilation ? "bg-emerald-600 hover:bg-emerald-500" : "border-slate-700 text-slate-400"}
              >
                {devices.ventilation ? "Включено" : "Выключено"}
              </Button>
            </div>

            {/* Sockets Relay */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Zap className={`h-5 w-5 ${devices.sockets ? "text-amber-400" : "text-slate-600"}`} />
                <div>
                  <div className="font-medium text-sm text-slate-200">Силовые розетки</div>
                  <div className="text-xs text-slate-500">Реле 2 (30A)</div>
                </div>
              </div>
              <Button
                variant={devices.sockets ? "default" : "outline"}
                size="sm"
                onClick={toggleSockets}
                className={devices.sockets ? "bg-amber-600 hover:bg-amber-500" : "border-slate-700 text-slate-400"}
              >
                {devices.sockets ? "Включено" : "Выключено"}
              </Button>
            </div>

            {/* Light Groups Relay */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-sky-400" />
                  <div>
                    <div className="font-medium text-sm text-slate-200">Группы освещения</div>
                    <div className="text-xs text-slate-500">Активных групп: {devices.lightGroups} из 4</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {[0, 1, 2, 3, 4].map((level) => (
                  <Button
                    key={level}
                    variant={devices.lightGroups === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLightGroups(level)}
                    className={`flex-1 text-xs ${
                      devices.lightGroups === level
                        ? "bg-sky-600 hover:bg-sky-500"
                        : "border-slate-700 text-slate-400"
                    }`}
                  >
                    {level === 0 ? "Off" : `${level} гр.`}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Chart */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">
              График динамики микроклимата (ESP32)
            </CardTitle>
            <CardDescription className="text-slate-400">
              История температуры и уровня CO2 за последние измерения
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#f43f5e" fontSize={12} domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} domain={['auto', 'auto']} />
                <RechartsTip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                />
                <Line yAxisId="left" type="monotone" dataKey="temp" name="Температура (°C)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="co2" name="CO2 (ppm)" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
