"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Cpu, Radio, Database, Lightbulb, Thermometer, Wind, Gauge, Network, Info, Wifi, Cable } from "lucide-react"
import { formatKGS } from "@/lib/currency"
import { useConfigData } from "@/hooks/use-config-data"
import { fetchSensorsDetailed } from "@/lib/services/config-service"

export default function ArchitecturePage() {
  const { data: sensors } = useConfigData(fetchSensorsDetailed)

  const getIconForType = (type: string) => {
    switch (type) {
      case "temperature_humidity":
      case "temperature_humidity_pressure":
        return Thermometer
      case "light_sensor":
        return Lightbulb
      case "co2_sensor":
        return Wind
      case "motion_sensor":
        return Gauge
      case "energy_meter":
        return Gauge
      default:
        return Gauge
    }
  }

  const getColorForType = (type: string) => {
    switch (type) {
      case "temperature_humidity":
      case "temperature_humidity_pressure":
        return "text-destructive"
      case "light_sensor":
        return "text-primary"
      case "co2_sensor":
        return "text-success"
      case "motion_sensor":
        return "text-accent"
      case "energy_meter":
        return "text-primary"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Архитектура системы</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Техническая документация, используемые датчики и концепция контроллера
          </p>
        </div>

        {/* System Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Общая архитектура
            </CardTitle>
            <CardDescription>Схема взаимодействия компонентов системы</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/30 p-8">
              <div className="flex flex-col gap-8">
                {/* Layer 1: Sensors */}
                <div className="text-center">
                  <Badge className="mb-4">Уровень 1: Датчики</Badge>
                  <div className="flex justify-center gap-4 flex-wrap">
                    {(sensors ?? []).slice(0, 4).map((sensor) => {
                      const Icon = getIconForType(sensor.type)
                      const color = getColorForType(sensor.type)
                      return (
                        <div
                          key={sensor.id}
                          className="flex flex-col items-center gap-2 bg-background p-4 rounded-lg border border-border min-w-[120px]"
                        >
                          <Icon className={`h-8 w-8 ${color}`} />
                          <div className="text-xs font-medium">{sensor.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {sensor.wifi_capable ? (
                              <span className="flex items-center gap-1">
                                <Wifi className="h-3 w-3" />
                                WiFi
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Cable className="h-3 w-3" />
                                {sensor.interface.split(" ")[0]}
                              </span>
                            )}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Arrows */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-0.5 bg-border" />
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Cable className="h-3 w-3" />
                      I²C, UART, GPIO, 1-Wire
                    </div>
                    <div className="h-8 w-0.5 bg-border" />
                  </div>
                </div>

                {/* Layer 2: Controllers */}
                <div className="text-center">
                  <Badge className="mb-4">Уровень 2: Контроллеры</Badge>
                  <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center gap-2 bg-primary/5 border-2 border-primary/20 p-6 rounded-lg min-w-[160px]">
                      <Cpu className="h-10 w-10 text-primary" />
                      <div className="text-sm font-semibold">ESP32</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        WiFi встроен
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrows */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-0.5 bg-border" />
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      WiFi / HTTP/MQTT
                    </div>
                    <div className="h-8 w-0.5 bg-border" />
                  </div>
                </div>

                {/* Layer 3: Backend */}
                <div className="text-center">
                  <Badge className="mb-4">Уровень 3: Backend & Хранилище</Badge>
                  <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center gap-2 bg-success/5 border-2 border-success/20 p-6 rounded-lg min-w-[160px]">
                      <Database className="h-10 w-10 text-success" />
                      <div className="text-sm font-semibold">База данных</div>
                      <div className="text-xs text-muted-foreground">PostgreSQL/MongoDB</div>
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-accent/5 border-2 border-accent/20 p-6 rounded-lg min-w-[160px]">
                      <Network className="h-10 w-10 text-accent" />
                      <div className="text-sm font-semibold">API Server</div>
                      <div className="text-xs text-muted-foreground">REST/MQTT Broker</div>
                    </div>
                  </div>
                </div>

                {/* Arrows */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-0.5 bg-border" />
                    <div className="text-xs text-muted-foreground">HTTPS / REST API</div>
                    <div className="h-8 w-0.5 bg-border" />
                  </div>
                </div>

                {/* Layer 4: Frontend */}
                <div className="text-center">
                  <Badge className="mb-4">Уровень 4: Веб-интерфейс</Badge>
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-2 bg-background border-2 border-border p-6 rounded-lg min-w-[200px]">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="text-sm font-semibold">Веб-платформа UniStat</div>
                      <div className="text-xs text-muted-foreground">Next.js + React</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sensors Detail with Modals */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Используемые датчики</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {(sensors ?? []).map((sensor) => {
              const Icon = getIconForType(sensor.type)
              const color = getColorForType(sensor.type)
              return (
                <Card key={sensor.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-8 w-8 ${color}`} />
                        <div>
                          <CardTitle className="text-lg">{sensor.name}</CardTitle>
                          <CardDescription>{sensor.category}</CardDescription>
                        </div>
                      </div>
                      {sensor.wifi_capable ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          WiFi
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Cable className="h-3 w-3" />
                          Wired
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Интерфейс</div>
                        <Badge variant="outline">{sensor.interface.split(" ")[0]}</Badge>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Цена</div>
                        <div className="font-semibold text-primary">{formatKGS(sensor.price_kgs)}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Применение</div>
                      <div className="text-sm">{sensor.use_case}</div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full gap-2">
                          <Info className="h-4 w-4" />
                          Подробнее
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Icon className={`h-6 w-6 ${color}`} />
                            {sensor.name} - Подробная информация
                          </DialogTitle>
                          <DialogDescription>{sensor.manufacturer} - {sensor.model}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                          {/* Specifications */}
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Технические характеристики
                            </h3>
                            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                              {Object.entries(sensor.specifications).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground capitalize">
                                    {key.replace(/_/g, " ")}:
                                  </span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Benefits */}
                          <div>
                            <h3 className="font-semibold mb-3">Преимущества</h3>
                            <ul className="space-y-2">
                              {sensor.benefits.map((benefit, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Installation Guide */}
                          <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Cable className="h-4 w-4" />
                              Инструкция по подключению
                            </h3>

                            <div className="space-y-4">
                              {/* Required Components */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">Необходимые компоненты:</h4>
                                <ul className="space-y-1">
                                  {sensor.installation_guide.required_components.map((comp, idx) => (
                                    <li key={idx} className="text-sm flex items-start gap-2">
                                      <div className="h-1 w-1 rounded-full bg-accent mt-2" />
                                      {comp}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Wiring */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">Схема подключения:</h4>
                                <div className="space-y-2 bg-background p-3 rounded">
                                  {Object.entries(sensor.installation_guide.wiring).map(([pin, description]) => (
                                    <div key={pin} className="text-sm">
                                      <span className="font-mono font-semibold text-primary">{pin}:</span>{" "}
                                      <span className="text-muted-foreground">{description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Software Setup */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">Программная настройка:</h4>
                                <p className="text-sm text-muted-foreground">
                                  {sensor.installation_guide.software_setup}
                                </p>
                              </div>

                              {/* Time Estimate */}
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="secondary">
                                  ⏱️ Время установки: {sensor.installation_guide.estimated_time}
                                </Badge>
                              </div>

                              {/* Notes/Warnings */}
                              {sensor.installation_guide.notes && (
                                <div className="mt-3 p-3 rounded bg-primary/5 border border-primary/20">
                                  <p className="text-sm">
                                    <strong>Примечание:</strong> {sensor.installation_guide.notes}
                                  </p>
                                </div>
                              )}
                              {sensor.installation_guide.safety_warning && (
                                <div className="mt-3 p-3 rounded bg-destructive/5 border border-destructive/20">
                                  <p className="text-sm font-semibold text-destructive">
                                    {sensor.installation_guide.safety_warning}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* WiFi Solution */}
                          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Wifi className="h-4 w-4" />
                              WiFi подключение
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">{sensor.wifi_solution.description}</p>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="font-medium">Рекомендуемая плата:</span>{" "}
                                <Badge>{sensor.wifi_solution.recommended_board}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <strong>Настройка:</strong> {sensor.wifi_solution.setup}
                              </div>
                            </div>
                          </div>

                          {/* Purchase Links */}
                          <div>
                            <h3 className="font-semibold mb-3">Где купить</h3>
                            <div className="flex flex-wrap gap-2">
                              {sensor.purchase_links.map((link, idx) => (
                                <Button key={idx} variant="outline" size="sm" asChild>
                                  <a href={link} target="_blank" rel="noopener noreferrer">
                                    Магазин {idx + 1}
                                  </a>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Data Flow */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Поток данных</CardTitle>
            <CardDescription>Как информация проходит через систему</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Сбор данных</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Датчики постоянно измеряют параметры окружающей среды (освещенность, температура, CO₂, движение) и
                    передают данные контроллеру через соответствующие интерфейсы (I²C, UART, GPIO, 1-Wire).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Обработка на контроллере</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    ESP32 контроллер считывает данные с датчиков, проводит первичную обработку (фильтрация, усреднение) и
                    формирует JSON пакеты данных для отправки.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Передача по WiFi</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Данные отправляются через встроенный WiFi модуль ESP32 на сервер с помощью HTTP POST запросов или MQTT
                    протокола. Частота отправки: каждые 30-60 секунд.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  4
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Хранение и анализ</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Backend сервер принимает данные через REST API, сохраняет в базу данных (PostgreSQL или MongoDB),
                    проводит аналитику и вычисляет метрики энергопотребления.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  5
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Визуализация</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Веб-интерфейс UniStat запрашивает данные через API и отображает их в виде графиков, карт и дашбордов
                    в реальном времени.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Note */}
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Важное замечание</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  В текущей версии системы данные симулируются, но вся архитектура основана на реальных устройствах с
                  проверенными техническими характеристиками. Система готова к интеграции с физическими датчиками и
                  контроллерами ESP32. Все указанные интерфейсы являются стандартными и широко поддерживаются. Подробные
                  инструкции по подключению доступны для каждого датчика.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
