"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp, Activity, Clock, Building2, Zap } from "lucide-react"
import { useConfigData } from "@/hooks/use-config-data"
import { fetchMonitoringAnalytics } from "@/lib/services/config-service"

export default function MonitoringPage() {
  const { data: energyData, isLoading } = useConfigData(fetchMonitoringAnalytics)
  const [timeRange, setTimeRange] = useState("24h")
  const [selectedBuilding, setSelectedBuilding] = useState("all")

  if (isLoading || !energyData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Загрузка данных...</p>
        </main>
      </div>
    )
  }

  const lightingPercent = ((energyData.current.lighting / energyData.current.total) * 100).toFixed(1)
  const heatingPercent = ((energyData.current.heating / energyData.current.total) * 100).toFixed(1)
  const ventilationPercent = ((energyData.current.ventilation / energyData.current.total) * 100).toFixed(1)
  const otherPercent = ((energyData.current.other / energyData.current.total) * 100).toFixed(1)

  const weeklyAvgBefore =
    energyData.trends.weekly.reduce((acc, day) => acc + day.before, 0) / energyData.trends.weekly.length
  const weeklyAvgAfter =
    energyData.trends.weekly.reduce((acc, day) => acc + day.after, 0) / energyData.trends.weekly.length
  const improvementPercent = (((weeklyAvgBefore - weeklyAvgAfter) / weeklyAvgBefore) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight">Мониторинг и аналитика</h1>
            <p className="text-lg text-muted-foreground">Долгосрочный анализ потребления энергии</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Последние 24 часа</SelectItem>
                <SelectItem value="7d">Последние 7 дней</SelectItem>
                <SelectItem value="30d">Последние 30 дней</SelectItem>
                <SelectItem value="90d">Последние 90 дней</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-40">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все корпуса</SelectItem>
                <SelectItem value="a">Корпус A</SelectItem>
                <SelectItem value="b">Корпус B</SelectItem>
                <SelectItem value="c">Корпус C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Общее потребление</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{energyData.current.total} кВт</div>
              <p className="mt-2 text-xs flex items-center gap-1 text-success">
                <TrendingDown className="h-3 w-3" />
                -12% от прошлой недели
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Освещение</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{energyData.current.lighting} кВт</div>
              <p className="mt-2 text-xs text-muted-foreground">{lightingPercent}% от общего</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Улучшение</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{improvementPercent}%</div>
              <p className="mt-2 text-xs text-muted-foreground">после оптимизации</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Экономия за месяц</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₽45,890</div>
              <p className="mt-2 text-xs flex items-center gap-1 text-success">
                <TrendingUp className="h-3 w-3" />
                +18% по плану
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trends">Динамика потребления</TabsTrigger>
            <TabsTrigger value="comparison">До и после</TabsTrigger>
            <TabsTrigger value="buildings">По корпусам</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Потребление энергии в течение дня</CardTitle>
                <CardDescription>Киловатты (кВт)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end justify-between gap-2 px-4">
                  {energyData.trends.daily.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-muted rounded-t-lg relative" style={{ height: "240px" }}>
                        <div
                          className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                          style={{ height: `${(item.value / 1500) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">{item.hour}</div>
                      <div className="text-xs font-semibold">{item.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribution Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Распределение по типам</CardTitle>
                <CardDescription>Процентное соотношение потребления</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Освещение</span>
                    </div>
                    <span className="text-sm font-semibold">{lightingPercent}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${lightingPercent}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{energyData.current.lighting} кВт</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Отопление</span>
                    </div>
                    <span className="text-sm font-semibold">{heatingPercent}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full" style={{ width: `${heatingPercent}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{energyData.current.heating} кВт</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Вентиляция</span>
                    </div>
                    <span className="text-sm font-semibold">{ventilationPercent}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: `${ventilationPercent}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{energyData.current.ventilation} кВт</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Прочее</span>
                    </div>
                    <span className="text-sm font-semibold">{otherPercent}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${otherPercent}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{energyData.current.other} кВт</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Сравнение: До и После оптимизации</CardTitle>
                <CardDescription>Недельное потребление (кВт)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end justify-between gap-3 px-4">
                  {energyData.trends.weekly.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex gap-1 items-end" style={{ height: "240px" }}>
                        <div className="flex-1 bg-muted rounded-t-lg relative">
                          <div
                            className="absolute bottom-0 w-full bg-muted-foreground/60 rounded-t-lg"
                            style={{ height: `${(item.before / 1600) * 100}%` }}
                          />
                        </div>
                        <div className="flex-1 bg-muted rounded-t-lg relative">
                          <div
                            className="absolute bottom-0 w-full bg-success rounded-t-lg"
                            style={{ height: `${(item.after / 1600) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">{item.day}</div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted-foreground line-through">{item.before}</span>
                        <span className="font-semibold text-success">{item.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-muted-foreground/60" />
                    <span>До оптимизации</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-success" />
                    <span>После оптимизации</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-success/5 border-success/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">{improvementPercent}% снижение потребления</div>
                    <div className="text-sm text-muted-foreground">
                      Среднее улучшение после внедрения энергосберегающих мер
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buildings Tab */}
          <TabsContent value="buildings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {energyData.buildings.map((building, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{building.name}</CardTitle>
                      <Badge
                        variant={building.status === "optimized" ? "default" : "secondary"}
                        className={building.status === "optimized" ? "bg-success text-white" : ""}
                      >
                        {building.status === "optimized" ? "Оптимизирован" : "Обычный"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Текущее потребление</div>
                      <div className="text-3xl font-bold">{building.consumption} кВт</div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="text-sm text-muted-foreground mb-1">Экономия за месяц</div>
                      <div className="text-2xl font-bold text-success">₽{building.savings.toLocaleString()}</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(building.consumption / 600) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
