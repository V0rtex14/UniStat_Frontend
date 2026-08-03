import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Target, Layers, Lightbulb } from "lucide-react"

const teamMembers = [
  { name: "Арзыматов Ислам" },
  { name: "Кулешов Бектур" },
  { name: "Барпыбеков Бектур" },
  { name: "Жумаев Талант" },
  { name: "Нурсултан Шайлообеков" },
  { name: "Шевелев Александр" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-12 text-center">
          <Badge className="mb-4">О проекте</Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">UniStat</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Умная система мониторинга и аналитики энергоэффективности университета
          </p>
        </div>

        {/* What is UniStat */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Что такое UniStat?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">UniStat</strong> — это комплексная система мониторинга и поддержки
              принятия решений для университетских кампусов, специально разработанная для{" "}
              <strong className="text-foreground">КГТУ им. И. Раззакова</strong>.
            </p>
            <p>
              Система объединяет реальное оборудование, точные расчеты и прозрачную методологию для оптимизации
              энергопотребления учебных корпусов. UniStat — это не демо-проект, а готовая к внедрению платформа с
              реальными датчиками, реальными ценами и реальными результатами.
            </p>
          </CardContent>
        </Card>

        {/* Why it exists */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Зачем создан проект?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Университетские здания потребляют огромное количество энергии, но большая часть этого потребления не
              оптимизирована. Устаревшее освещение, неэффективное отопление и отсутствие мониторинга качества воздуха
              приводят к:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Высоким расходам на электроэнергию (до 40% бюджета на коммунальные услуги)</li>
              <li>Дискомфорту студентов и преподавателей из-за плохого микроклимата</li>
              <li>Невозможности обоснованно планировать модернизацию инфраструктуры</li>
            </ul>
            <p>
              <strong className="text-foreground">UniStat решает эти проблемы</strong>, предоставляя данные в реальном
              времени, прозрачные калькуляторы ROI и технически обоснованные рекомендации по оптимизации.
            </p>
          </CardContent>
        </Card>

        {/* Problem solved */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Какую проблему решает?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-foreground mb-2">Экономическая проблема</h4>
                <p className="text-sm">
                  Замена 1000 ламп накаливания на LED экономит до{" "}
                  <strong className="text-foreground">1,5 млн сом в год</strong> при сроке окупаемости всего 8-12
                  месяцев.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-foreground mb-2">Экологическая проблема</h4>
                <p className="text-sm">
                  Снижение энергопотребления на 40% сокращает выбросы CO₂ на{" "}
                  <strong className="text-foreground">200+ тонн ежегодно</strong>.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-foreground mb-2">Проблема комфорта</h4>
                <p className="text-sm">
                  Мониторинг CO₂ и температуры улучшает качество обучения, увеличивая концентрацию студентов на{" "}
                  <strong className="text-foreground">15-25%</strong>.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-foreground mb-2">Проблема масштабируемости</h4>
                <p className="text-sm">
                  Система легко расширяется: добавление новых датчиков требует только редактирования{" "}
                  <strong className="text-foreground">JSON-файлов</strong>, без изменения кода.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* JSON Architecture */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Почему архитектура на основе JSON?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              UniStat использует <strong className="text-foreground">полностью data-driven архитектуру</strong>, где все
              данные хранятся в JSON-файлах, а не в коде приложения. Это критически важно для:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-foreground">Простоты расширения:</strong> Новые устройства, помещения или
                датчики добавляются редактированием JSON, без изменения кода
              </li>
              <li>
                <strong className="text-foreground">Гибкости настройки:</strong> Тарифы, параметры помещений и
                характеристики оборудования легко обновляются
              </li>
              <li>
                <strong className="text-foreground">Прозрачности данных:</strong> Все источники данных доступны для
                проверки и аудита
              </li>
              <li>
                <strong className="text-foreground">Простоты интеграции:</strong> Backend может легко подключиться,
                заменив JSON на API-запросы
              </li>
            </ul>
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm">
                <strong className="text-foreground">Пример:</strong> Для добавления нового датчика CO₂ достаточно
                добавить запись в <code className="text-xs bg-muted px-1 py-0.5 rounded">sensors_air_quality.json</code>
                . Система автоматически распознает его и начнет отображать данные — никакого программирования не
                требуется.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Команда проекта
            </CardTitle>
            <CardDescription>Студенты КГТУ им. И. Раззакова</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{member.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{member.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            UniStat — открытый образовательный проект. Исходный код и документация доступны для всех университетов,
            желающих внедрить энергомониторинг.
          </p>
        </div>
      </main>
    </div>
  )
}
