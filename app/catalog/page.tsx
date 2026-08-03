"use client"

import { useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lightbulb, Gauge, Thermometer, Wind, ExternalLink, Info, Zap, DoorClosed, Unplug, Lightbulb as SmartBulb, Sparkles } from "lucide-react"
import { formatKGS } from "@/lib/currency"
import { useConfigData } from "@/hooks/use-config-data"
import { fetchCatalogEquipment, fetchCatalogUseful } from "@/lib/services/config-service"

export default function CatalogPage() {
  const { data: catalogData } = useConfigData(fetchCatalogEquipment)
  const { data: usefulData } = useConfigData(fetchCatalogUseful)
  const [selectedTab, setSelectedTab] = useState("temperature")

  const getIconForType = (type: string) => {
    if (type.includes("temperature") || type.includes("humidity")) return Thermometer
    if (type.includes("light_sensor")) return Lightbulb
    if (type.includes("air") || type.includes("particulate")) return Wind
    if (type.includes("door_closer")) return DoorClosed
    if (type.includes("led_lamp")) return Zap
    if (type.includes("motion") || type.includes("presence")) return Gauge
    if (type.includes("smart_socket")) return Unplug
    if (type.includes("smart_bulb")) return SmartBulb
    return Gauge
  }

  const renderEquipmentCard = (equipment: Equipment) => {
    const Icon = getIconForType(equipment.type)

    return (
      <Card key={equipment.id} className="transition-all hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Icon className="h-8 w-8 text-primary" />
            <Badge variant="secondary">${equipment.price_usd}</Badge>
          </div>
          <CardTitle className="text-lg leading-tight">{equipment.name}</CardTitle>
          <CardDescription>{equipment.manufacturer}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground line-clamp-2">{equipment.description}</div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Интерфейс</div>
              <Badge variant="outline" className="mt-1">
                {equipment.interface}
              </Badge>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Цена</div>
              <div className="font-semibold text-primary mt-1">{formatKGS(equipment.price_kgs)}</div>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Info className="h-4 w-4" />
                Подробнее
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-primary" />
                  {equipment.full_name}
                </DialogTitle>
                <DialogDescription>{equipment.manufacturer}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Description */}
                <div>
                  <p className="text-sm leading-relaxed">{equipment.description}</p>
                </div>

                {/* How it works */}
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Как это работает?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{equipment.how_it_works}</p>
                </div>

                {/* Important Note */}
                {equipment.important_note && (
                  <div className="rounded-lg bg-warning/5 border border-warning/20 p-4">
                    <h3 className="font-semibold mb-2 text-warning flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Важное примечание
                    </h3>
                    <p className="text-sm leading-relaxed">{equipment.important_note}</p>
                  </div>
                )}

                {/* Specifications */}
                <div>
                  <h3 className="font-semibold mb-3">Технические характеристики</h3>
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    {Object.entries(equipment.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advantages */}
                <div>
                  <h3 className="font-semibold mb-3">Преимущества</h3>
                  <ul className="space-y-2">
                    {equipment.advantages.map((advantage, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5" />
                        {advantage}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Use Cases */}
                <div>
                  <h3 className="font-semibold mb-3">Применение</h3>
                  <div className="grid gap-2">
                    {equipment.use_cases.map((useCase, idx) => (
                      <div key={idx} className="rounded-lg bg-primary/5 p-3 text-sm border border-primary/20">
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <h3 className="font-semibold mb-3">Стоимость</h3>
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-bold text-primary">{formatKGS(equipment.price_kgs)}</div>
                    <div className="text-sm text-muted-foreground">(${equipment.price_usd})</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Курс конвертации: $1 ≈ 85 сом
                  </p>
                </div>

                {/* Purchase Links */}
                <div>
                  <h3 className="font-semibold mb-3">Где купить</h3>
                  <div className="flex flex-wrap gap-2">
                    {equipment.purchase_links.map((link, idx) => (
                      <Button key={idx} variant="outline" size="sm" asChild>
                        <a href={link} target="_blank" rel="noopener noreferrer" className="gap-2">
                          <ExternalLink className="h-3 w-3" />
                          {new URL(link).hostname.replace("www.", "")}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Problem it solves */}
                <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Какую проблему решает?
                  </h3>
                  <p className="text-sm leading-relaxed">
                    {equipment.type.includes("temperature") &&
                      "Позволяет контролировать температурный режим в помещениях для оптимизации отопления и обеспечения комфорта. Помогает выявить перегрев или недогрев аудиторий, что напрямую влияет на энергопотребление и производительность учащихся."}
                    {equipment.type.includes("light") &&
                      "Измеряет фактический уровень освещенности для обеспечения соответствия нормам (300-500 люкс для учебных помещений). Помогает оптимизировать использование естественного и искусственного освещения, экономя электроэнергию без ущерба для качества обучения."}
                    {equipment.type.includes("air_quality") &&
                      "Контролирует качество воздуха, включая уровень CO₂ и загрязняющих веществ. Высокий CO₂ (>1000 ppm) снижает концентрацию и вызывает усталость. Датчик помогает определить необходимость проветривания или улучшения вентиляции."}
                    {equipment.type.includes("particulate") &&
                      "Измеряет концентрацию мелкодисперсных частиц (PM2.5, PM10), которые вредны для здоровья. Особенно важно в городских условиях и помещениях с плохой вентиляцией. Помогает контролировать эффективность систем очистки воздуха."}
                  </p>
                </div>

                {/* Energy Savings (for useful products) */}
                {equipment.energy_savings && (
                  <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-success" />
                      Экономия энергии
                    </h3>
                    <p className="text-sm leading-relaxed">{equipment.energy_savings}</p>
                  </div>
                )}

                {/* Necessity */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <h3 className="font-semibold mb-2">
                    {equipment.energy_savings ? "Почему это важно?" : "Необходимость для проекта"}
                  </h3>
                  <p className="text-sm leading-relaxed">
                    {equipment.energy_savings
                      ? "Энергосберегающие решения — это не просто экономия денег, но и вклад в экологию и комфорт. Снижение энергопотребления уменьшает нагрузку на электросети, сокращает выбросы CO₂ и создает более устойчивую образовательную среду."
                      : "Этот датчик является ключевым компонентом системы UniStat для сбора объективных данных о состоянии помещений. Без реальных измерений невозможно принимать обоснованные решения об оптимизации энергопотребления и улучшении условий обучения. Данные от этого датчика используются для расчета ROI, мониторинга эффективности внедренных улучшений и формирования отчетов для руководства университета."}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  if (!catalogData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Header />
        <p>Загрузка каталога...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Каталог оборудования</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Реальные устройства с подробными характеристиками, ценами и ссылками на покупку
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="temperature" className="gap-2">
              <Thermometer className="h-4 w-4" />
              Температура
            </TabsTrigger>
            <TabsTrigger value="light" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Освещение
            </TabsTrigger>
            <TabsTrigger value="air" className="gap-2">
              <Wind className="h-4 w-4" />
              Воздух
            </TabsTrigger>
            <TabsTrigger value="useful" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Полезное
            </TabsTrigger>
          </TabsList>

          {/* Temperature & Humidity Sensors */}
          <TabsContent value="temperature">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Датчики температуры и влажности</h2>
              <p className="text-muted-foreground">
                Для мониторинга микроклимата в учебных помещениях. Рекомендуется 2-3 датчика на аудиторию 50-100 м².
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {catalogData.temperature_humidity_sensors.map((equipment) => renderEquipmentCard(equipment))}
            </div>
          </TabsContent>

          {/* Light Sensors */}
          <TabsContent value="light">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Датчики освещенности</h2>
              <p className="text-muted-foreground">
                Для измерения уровня освещенности и оптимизации использования света. Рекомендуется 1-2 датчика на
                аудиторию.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {catalogData.light_sensors.map((equipment) => renderEquipmentCard(equipment))}
            </div>
          </TabsContent>

          {/* Air Quality Sensors */}
          <TabsContent value="air">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Датчики качества воздуха</h2>
              <p className="text-muted-foreground">
                Для контроля CO₂, летучих органических соединений и мелкодисперсной пыли. Обычно 1 датчик на
                аудиторию при равномерной вентиляции.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {catalogData.air_quality_sensors.map((equipment) => renderEquipmentCard(equipment))}
            </div>
          </TabsContent>

          {/* Useful Energy-Saving Products */}
          <TabsContent value="useful">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-3">Полезное для энергосбережения</h2>
              <p className="text-muted-foreground text-lg">
                Дополнительные устройства и решения, которые помогут снизить энергопотребление университета. Все товары с
                реальными ценами и ссылками на покупку в Кыргызстане.
              </p>
            </div>

            {usefulData && (
              <div className="space-y-10">
                {/* Door Closers */}
                <div>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    <DoorClosed className="h-6 w-6 text-primary" />
                    Доводчики дверей
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Автоматическое закрывание дверей предотвращает потери тепла зимой и холода летом. Экономия на
                    отоплении/кондиционировании до 15-20% для помещений у входных дверей.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {usefulData.door_closers.map((equipment) => renderEquipmentCard(equipment))}
                  </div>
                </div>

                {/* LED Lamps */}
                <div>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    <Zap className="h-6 w-6 text-amber-500" />
                    Энергосберегающие LED лампы
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Замена ламп накаливания на LED даёт экономию энергии до 85-88%. Для университета с 1000 ламп экономия
                    составляет ~34,000 сом/месяц при окупаемости менее 1 месяца.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {usefulData.led_lamps.map((equipment) => renderEquipmentCard(equipment))}
                  </div>
                </div>

                {/* Motion Sensors */}
                <div>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    <Gauge className="h-6 w-6 text-blue-500" />
                    Датчики движения и присутствия
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Автоматическое управление освещением на основе присутствия людей. Экономия 30-40% электроэнергии на
                    освещение в коридорах, туалетах и редко используемых помещениях.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {usefulData.motion_sensors.map((equipment) => renderEquipmentCard(equipment))}
                  </div>
                </div>

                {/* Smart Sockets */}
                <div>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    <Unplug className="h-6 w-6 text-purple-500" />
                    Умные розетки
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Полное отключение оборудования в нерабочее время по расписанию. Проекторы, принтеры и другая техника в
                    режиме ожидания потребляют 5-15 Вт впустую — умные розетки это исключают.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {usefulData.smart_sockets.map((equipment) => renderEquipmentCard(equipment))}
                  </div>
                </div>

                {/* Smart Bulbs */}
                <div>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    <SmartBulb className="h-6 w-6 text-yellow-500" />
                    Умные лампочки
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    LED лампы с WiFi управлением, диммированием и автоматическими расписаниями. Снижение яркости на 50%
                    даёт экономию энергии ~40-50%, а автовыключение предотвращает забывчивость.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {usefulData.smart_bulbs.map((equipment) => renderEquipmentCard(equipment))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Technical Note */}
        <Card className="mt-8 bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Техническое примечание
            </h3>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Все указанные устройства являются реальными продуктами с проверенными техническими характеристиками.
                Цены актуальны на декабрь 2025 года и могут варьироваться в зависимости от поставщика и региона.
              </p>
              <p>
                Система поддерживает интеграцию с контроллерами ESP32, Arduino и Raspberry Pi через указанные
                интерфейсы. Большинство датчиков доступны для покупки в Кыргызстане через локальные магазины
                электроники или онлайн-платформы.
              </p>
              <p className="font-medium">
                Курс конвертации: $1 ≈ 87 сом 
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
