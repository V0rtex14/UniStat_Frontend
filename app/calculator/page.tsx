"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lightbulb, Thermometer, Calculator, TrendingUp, Info, Building2 } from "lucide-react"
import { formatKGS, DEFAULT_TARIFF_KGS } from "@/lib/currency"
import { useConfigData } from "@/hooks/use-config-data"
import { fetchLightingProducts, fetchRooms, fetchTariffs } from "@/lib/services/config-service"
import type { LightingProduct, Room } from "@/lib/types"

export default function CalculatorPage() {
  const { data: lampsData } = useConfigData(fetchLightingProducts)
  const { data: roomsData } = useConfigData(fetchRooms)
  const { data: tariffsData } = useConfigData(fetchTariffs)

  const [currentLamp, setCurrentLamp] = useState<LightingProduct | null>(null)
  const [newLamp, setNewLamp] = useState<LightingProduct | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // Lighting calculator state
  const [hoursPerDay, setHoursPerDay] = useState("8")
  const [daysPerYear, setDaysPerYear] = useState("250")
  const [tariff, setTariff] = useState(DEFAULT_TARIFF_KGS.toString())
  const [quantity, setQuantity] = useState("20")
  const [roomArea, setRoomArea] = useState("50")

  // Temperature calculator state
  const [currentTemp, setCurrentTemp] = useState("0")
  const [recommendedTemp, setRecommendedTemp] = useState("21")
  const [tempRoomArea, setTempRoomArea] = useState("50")
  const [heatingCostPerM2, setHeatingCostPerM2] = useState("120")

  // Initialize defaults when data loads
  useEffect(() => {
    if (lampsData) {
      const incandescent = lampsData.find((l) => l.type === "incandescent")
      const led = lampsData.find((l) => l.type === "led")
      if (incandescent && !currentLamp) setCurrentLamp(incandescent)
      if (led && !newLamp) setNewLamp(led)
    }
  }, [lampsData]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tariffsData) {
      setTariff(tariffsData.electricity.current_rate_kgs_per_kwh.toString())
    }
  }, [tariffsData])

  const lamps = lampsData ?? []
  const rooms = roomsData ?? []
  const tariffs = tariffsData

  const handleRoomSelection = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
      setRoomArea(room.area_m2.toString())
      setQuantity(room.lamp_count.toString())
      setTempRoomArea(room.area_m2.toString())
    }
  }

  const calculateLighting = () => {
    if (!currentLamp || !newLamp) return null

    const hours = Number.parseFloat(hoursPerDay)
    const days = Number.parseFloat(daysPerYear)
    const rate = Number.parseFloat(tariff)
    const qty = Number.parseFloat(quantity)

    const currentEnergyPerDay = (currentLamp.power_w * hours) / 1000
    const newEnergyPerDay = (newLamp.power_w * hours) / 1000

    const currentEnergyPerYear = currentEnergyPerDay * days
    const newEnergyPerYear = newEnergyPerDay * days

    const currentCostPerYear = currentEnergyPerYear * rate * qty
    const newCostPerYear = newEnergyPerYear * rate * qty

    const savings = currentCostPerYear - newCostPerYear
    const investment = newLamp.price_kgs * qty
    const paybackMonths = (investment / savings) * 12

    return {
      currentEnergyPerDay: (currentEnergyPerDay * qty).toFixed(2),
      newEnergyPerDay: (newEnergyPerDay * qty).toFixed(2),
      currentEnergyPerYear: currentEnergyPerYear.toFixed(2),
      newEnergyPerYear: newEnergyPerYear.toFixed(2),
      currentCostPerYear: currentCostPerYear.toFixed(2),
      newCostPerYear: newCostPerYear.toFixed(2),
      savings: savings.toFixed(2),
      investment: investment.toFixed(2),
      paybackMonths: paybackMonths.toFixed(1),
      paybackYears: (paybackMonths / 12).toFixed(2),
      energySavingPercent: (((currentEnergyPerYear - newEnergyPerYear) / currentEnergyPerYear) * 100).toFixed(1),
    }
  }

  const calculateTemperature = () => {
    const current = Number.parseFloat(currentTemp)
    const recommended = Number.parseFloat(recommendedTemp)
    const area = Number.parseFloat(tempRoomArea)
    const costPerM2 = Number.parseFloat(heatingCostPerM2)

    if (current === 0) {
      return {
        tempDifference: "0",
        overheatingPercent: "0",
        currentHeatingCost: (area * costPerM2).toFixed(2),
        potentialSavings: "0",
        annualSavings: "0",
        isZero: true,
      }
    }

    const tempDifference = current - recommended
    const overheatingPercent = (tempDifference / recommended) * 100
    const currentHeatingCost = area * costPerM2
    const potentialSavings = currentHeatingCost * (tempDifference / current)
    const annualSavings = potentialSavings * 7 // heating months

    return {
      tempDifference: tempDifference.toFixed(1),
      overheatingPercent: overheatingPercent.toFixed(1),
      currentHeatingCost: currentHeatingCost.toFixed(2),
      potentialSavings: potentialSavings.toFixed(2),
      annualSavings: annualSavings.toFixed(2),
      isZero: false,
    }
  }

  const lightingResults = calculateLighting()
  const tempResults = calculateTemperature()

  if (!currentLamp || !newLamp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Header />
        <p>Загрузка данных...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Калькуляторы эффективности</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Прозрачные расчеты окупаемости и эффективности с пошаговым объяснением
          </p>
        </div>

        <Tabs defaultValue="lighting" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2">
            <TabsTrigger value="lighting" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Освещение
            </TabsTrigger>
            <TabsTrigger value="temperature" className="gap-2">
              <Thermometer className="h-4 w-4" />
              Отопление
            </TabsTrigger>
          </TabsList>

          {/* LIGHTING CALCULATOR */}
          <TabsContent value="lighting">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Panel - Input Selection */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Входные данные
                    </CardTitle>
                    <CardDescription>Введите параметры вашего помещения для расчета</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Room Selection */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Выбор аудитории (опционально)
                      </Label>
                      <Select onValueChange={handleRoomSelection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите аудиторию или введите данные вручную" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} - {room.area_m2} м² ({room.lamp_count} ламп)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRoom && (
                        <div className="mt-2 rounded-lg bg-primary/5 p-3 text-sm border border-primary/20">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Корпус:</span>
                            <span className="font-medium">
                              {selectedRoom.building_id === "building_1" ? "Корпус 1" : "Корпус 2"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Этаж:</span>
                            <span className="font-medium">{selectedRoom.floor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Площадь:</span>
                            <span className="font-medium">{selectedRoom.area_m2} м²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Количество ламп:</span>
                            <span className="font-medium">{selectedRoom.lamp_count} шт</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Current Lamp Selection */}
                    <div className="space-y-2">
                      <Label>Текущий тип освещения</Label>
                      <Select
                        value={currentLamp.id}
                        onValueChange={(value) => {
                          const lamp = lamps.find((l) => l.id === value)
                          if (lamp) setCurrentLamp(lamp)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lamps
                            .filter((l) => l.type === "incandescent")
                            .map((lamp) => (
                              <SelectItem key={lamp.id} value={lamp.id}>
                                {lamp.model}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Мощность:</span>
                          <span className="font-medium">{currentLamp.power_w} Вт</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Световой поток:</span>
                          <span className="font-medium">{currentLamp.luminous_flux_lm} лм</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Цена:</span>
                          <span className="font-medium">{formatKGS(currentLamp.price_kgs)}</span>
                        </div>
                      </div>
                    </div>

                    {/* New Lamp Selection */}
                    <div className="space-y-2">
                      <Label>Новый тип освещения</Label>
                      <Select
                        value={newLamp.id}
                        onValueChange={(value) => {
                          const lamp = lamps.find((l) => l.id === value)
                          if (lamp) setNewLamp(lamp)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lamps
                            .filter((l) => l.type === "led")
                            .map((lamp) => (
                              <SelectItem key={lamp.id} value={lamp.id}>
                                {lamp.model}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2 rounded-lg bg-primary/5 p-3 text-sm border border-primary/20">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Мощность:</span>
                          <span className="font-medium text-primary">{newLamp.power_w} Вт</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Световой поток:</span>
                          <span className="font-medium text-primary">{newLamp.luminous_flux_lm} лм</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Цена:</span>
                          <span className="font-medium text-primary">{formatKGS(newLamp.price_kgs)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Usage Parameters */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Количество ламп</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="20"
                        />
                        <p className="text-xs text-muted-foreground">
                          <Info className="inline h-3 w-3 mr-1" />
                          {selectedRoom
                            ? "Автоматически заполнено из выбранной аудитории"
                            : "Введите количество ламп в помещении"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hours">Часов работы в день</Label>
                        <Input
                          id="hours"
                          type="number"
                          value={hoursPerDay}
                          onChange={(e) => setHoursPerDay(e.target.value)}
                          placeholder="8"
                        />
                        <p className="text-xs text-muted-foreground">
                          <Info className="inline h-3 w-3 mr-1" />
                          Среднее время работы освещения в учебный день
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="days">Рабочих дней в году</Label>
                        <Input
                          id="days"
                          type="number"
                          value={daysPerYear}
                          onChange={(e) => setDaysPerYear(e.target.value)}
                          placeholder="250"
                        />
                        <p className="text-xs text-muted-foreground">
                          <Info className="inline h-3 w-3 mr-1" />
                          Обычно 250-260 дней для учебных заведений
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tariff" className="flex items-center gap-2">
                          Тариф (сом/кВт·ч)
                          {tariffs && (
                            <span className="text-xs font-normal text-muted-foreground">(фиксированный)</span>
                          )}
                        </Label>
                        <Input
                          id="tariff"
                          type="number"
                          step="0.01"
                          value={tariff}
                          onChange={(e) => setTariff(e.target.value)}
                          placeholder="1.68"
                        />
                        {tariffs && (
                          <div className="mt-2 rounded-lg bg-accent/10 p-3 text-xs border border-accent/20">
                            <p className="font-medium mb-1">Источник тарифа:</p>
                            <p className="text-muted-foreground">{tariffs.electricity.description}</p>
                            <p className="text-muted-foreground mt-1">
                              Обновлено: {tariffs.electricity.last_updated}
                            </p>
                            <p className="text-muted-foreground">Источник: {tariffs.electricity.source}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Results */}
              <div className="space-y-6">
                {lightingResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Результаты расчета
                      </CardTitle>
                      <CardDescription>Детальный анализ экономии и окупаемости</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Energy Comparison */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Потребление энергии
                        </h3>
                        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Текущее (в день):</span>
                            <span className="font-mono font-semibold">{lightingResults.currentEnergyPerDay} кВт·ч</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Новое (в день):</span>
                            <span className="font-mono font-semibold text-primary">
                              {lightingResults.newEnergyPerDay} кВт·ч
                            </span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-border">
                            <span className="text-muted-foreground">Экономия энергии:</span>
                            <span className="font-mono font-semibold text-success">
                              {lightingResults.energySavingPercent}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cost Comparison */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Годовые затраты
                        </h3>
                        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Текущие затраты:</span>
                            <span className="font-mono font-semibold">
                              {formatKGS(Number(lightingResults.currentCostPerYear))}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Новые затраты:</span>
                            <span className="font-mono font-semibold text-primary">
                              {formatKGS(Number(lightingResults.newCostPerYear))}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-border">
                            <span className="text-muted-foreground">Годовая экономия:</span>
                            <span className="font-mono font-bold text-success text-lg">
                              {formatKGS(Number(lightingResults.savings))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ROI Calculation */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Окупаемость инвестиций (ROI)</h3>
                        <div className="rounded-lg bg-primary/5 border-2 border-primary/20 p-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Инвестиции:</span>
                            <span className="font-mono font-semibold">
                              {formatKGS(Number(lightingResults.investment))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Срок окупаемости:</span>
                            <div className="text-right">
                              <div className="font-mono font-bold text-2xl text-primary">
                                {lightingResults.paybackMonths} мес
                              </div>
                              <div className="text-xs text-muted-foreground">({lightingResults.paybackYears} лет)</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Explanation */}
                      <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Как рассчитано
                        </h4>
                        <ul className="text-xs space-y-1 text-muted-foreground leading-relaxed">
                          <li>1. Энергия в день = (Мощность × Часы) / 1000</li>
                          <li>2. Энергия в год = Энергия в день × Дни</li>
                          <li>3. Стоимость = Энергия × Тариф × Количество</li>
                          <li>4. Экономия = Текущая стоимость - Новая стоимость</li>
                          <li>5. Окупаемость = (Инвестиции / Экономия) × 12 месяцев</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TEMPERATURE CALCULATOR */}
          <TabsContent value="temperature">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Параметры отопления
                  </CardTitle>
                  <CardDescription>Оцените потенциал экономии на отоплении</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentTemp">Текущая температура (°C)</Label>
                    <Input
                      id="currentTemp"
                      type="number"
                      step="0.1"
                      value={currentTemp}
                      onChange={(e) => setCurrentTemp(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      <Info className="inline h-3 w-3 mr-1" />
                      Средняя температура по датчикам температуры в помещении (пока не подключены - значение 0)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recommendedTemp">Рекомендуемая температура (°C)</Label>
                    <Input
                      id="recommendedTemp"
                      type="number"
                      step="0.1"
                      value={recommendedTemp}
                      onChange={(e) => setRecommendedTemp(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Норма для учебных помещений: 20-22°C</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tempRoomArea">Площадь помещения (м²)</Label>
                    <Input
                      id="tempRoomArea"
                      type="number"
                      value={tempRoomArea}
                      onChange={(e) => setTempRoomArea(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      <Info className="inline h-3 w-3 mr-1" />
                      {selectedRoom
                        ? "Автоматически заполнено из выбранной аудитории на вкладке Освещение"
                        : "Введите площадь помещения"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heatingCost" className="flex items-center gap-2">
                      Стоимость отопления (сом/м² в месяц)
                      <span className="text-xs font-normal text-muted-foreground">(фиксированная)</span>
                    </Label>
                    <Input
                      id="heatingCost"
                      type="number"
                      value={heatingCostPerM2}
                      onChange={(e) => setHeatingCostPerM2(e.target.value)}
                    />
                    {tariffs && (
                      <p className="text-xs text-muted-foreground">
                        <Info className="inline h-3 w-3 mr-1" />
                        {tariffs.heating.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Результаты анализа</CardTitle>
                  <CardDescription>Потенциал экономии при оптимизации температуры</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {tempResults.isZero ? (
                    <div className="rounded-lg bg-warning/5 border-2 border-warning/20 p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-warning mt-0.5" />
                        <div>
                          <h3 className="font-semibold mb-2">Датчики температуры не подключены</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Для получения реальных данных о температуре необходимо установить датчики DS18B20 или DHT22
                            в помещениях. После подключения система автоматически начнет считывать показания и
                            рассчитывать потенциал экономии.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Превышение температуры:</span>
                          <span className="font-mono font-semibold text-warning">{tempResults.tempDifference}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Перегрев:</span>
                          <span className="font-mono font-semibold text-warning">
                            {tempResults.overheatingPercent}%
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-primary/5 border-2 border-primary/20 p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Текущие затраты/месяц:</span>
                          <span className="font-mono font-semibold">
                            {formatKGS(Number(tempResults.currentHeatingCost))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Экономия/месяц:</span>
                          <span className="font-mono font-bold text-success text-lg">
                            {formatKGS(Number(tempResults.potentialSavings))}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-primary/20">
                          <span className="text-sm text-muted-foreground">Годовая экономия:</span>
                          <span className="font-mono font-bold text-success text-xl">
                            {formatKGS(Number(tempResults.annualSavings))}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Рекомендации
                    </h4>
                    <ul className="text-xs space-y-1 text-muted-foreground leading-relaxed">
                      <li>• Снижение температуры на 1°C экономит до 6% энергии</li>
                      <li>• Рекомендуемая температура для аудиторий: 20-22°C</li>
                      <li>• Используйте программируемые термостаты</li>
                      <li>• Проверьте утепление окон и дверей</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
