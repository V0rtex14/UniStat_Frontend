"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

import { db, CLASSROOM_COLLECTION, CLASSROOM_DOC_ID } from "@/lib/firebase"
import {
  doc, setDoc, updateDoc,
  collection, getDocs, addDoc, query, orderBy, limit,
} from "firebase/firestore"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Wind, Lightbulb, Zap, Activity, Power, Cpu,
  Timer, CheckCircle2, XCircle, ArrowRight,
  Thermometer, Droplets, Sun, CloudFog, Info, AlertTriangle,
  TrendingUp, TrendingDown, RefreshCw, Radio,
  LayoutDashboard, BarChart2, Settings, Users,
  Clock, FileDown, Calendar, Award, Database,
} from "lucide-react"
import {
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip,
  Legend, ResponsiveContainer,
} from "recharts"

// ──────────────────────────────────────────────────────────────────────────────
// Типы
// ──────────────────────────────────────────────────────────────────────────────

interface TelemetrySnap {
  ts: number
  pm25: number
  co2: number
  lux: number
  temp: number
  humidity: number
  powerKw: number
}

interface LogEntry {
  ts: string
  raw: string
  deviation: number
  worse: boolean
}

interface ArchiveEntry {
  id: string
  timestamp: string          // ISO 8601 — for display
  ts: number                 // Unix ms — for sorting / charts
  pm25: number
  co2: number
  lux: number
  temp: number
  humidity: number
  powerKw: number
  relays: { ventilation: boolean; sockets: boolean; lightGroups: number }
  daily_energy: number
}

type ActiveTab = "control" | "analytics" | "architecture" | "team"

// ──────────────────────────────────────────────────────────────────────────────
// Константы
// ──────────────────────────────────────────────────────────────────────────────

const MANUAL_OVERRIDE_SECONDS = 7200
const KWH_DAILY_WARN          = 15
const DEBOUNCE_TOGGLE_MS      = 400
const DEBOUNCE_SLIDER_MS      = 500
const HISTORY_COLLECTION      = "classroom_history"

// Нулевой снимок — отображается до получения архива из Firestore
const ZERO_SNAP: TelemetrySnap = {
  ts: 0, pm25: 0, co2: 0, lux: 0, temp: 0, humidity: 0, powerKw: 0,
}

// ──────────────────────────────────────────────────────────────────────────────
// Вспомогательные функции
// ──────────────────────────────────────────────────────────────────────────────

function fmtHMS(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
}

function pctDiff(current: number, previous: number): number {
  if (previous === 0) return 0
  return parseFloat(((current - previous) / previous * 100).toFixed(1))
}

function computeVentRec(pm25: number, co2: number): { clearMin: number; recMin: number } {
  const pm25Factor = Math.max(1, pm25 / 15)
  const co2Factor  = Math.max(1, co2  / 1000)
  const clearMin   = Math.round(pm25Factor * 3.2 + co2Factor * 2.1)
  return { clearMin, recMin: clearMin + 2 }
}

function MetricTooltip({ standard, deviation, tolerance, extra }: {
  standard: string; deviation: string; tolerance: string; extra?: string
}) {
  return (
    <div className="space-y-1.5 max-w-xs text-xs leading-relaxed">
      <p><span className="font-semibold">Норма (стандарт):</span> {standard}</p>
      <p><span className="font-semibold">Отклонение:</span> {deviation}</p>
      <p><span className="font-semibold">Погрешность датчика:</span> {tolerance}</p>
      {extra && <p className="border-t pt-1 mt-1 text-muted-foreground">{extra}</p>}
    </div>
  )
}

function exportPDF(telemetry: TelemetrySnap, archive: ArchiveEntry[], kwhToday: number) {
  const win = window.open("", "_blank")
  if (!win) return
  const now = new Date().toLocaleString("ru-RU")
  const rows = archive.slice(-7)
  const avgPm25 = rows.length
    ? (rows.reduce((s, d) => s + d.pm25, 0) / rows.length).toFixed(1) : "0"
  const avgCo2 = rows.length
    ? (rows.reduce((s, d) => s + d.co2,  0) / rows.length).toFixed(0) : "0"
  const avgKw = rows.length
    ? (rows.reduce((s, d) => s + d.powerKw, 0) / rows.length).toFixed(3) : "0"
  const pm25ExceedPct = ((parseFloat(avgPm25) / 15 - 1) * 100).toFixed(0)
  win.document.write(`<!DOCTYPE html><html lang="ru"><head>
<meta charset="UTF-8"><title>UniStat — Аналитический отчёт</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a1a;background:#fff;padding:40px}
  h1{font-size:22px;font-weight:700;margin-bottom:4px}
  h2{font-size:15px;font-weight:600;margin:28px 0 10px;color:#2c3e50;border-bottom:1px solid #e5e7eb;padding-bottom:6px}
  .sub{font-size:12px;color:#64748b;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#f8fafc;text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border:1px solid #e2e8f0}
  td{padding:8px 12px;border:1px solid #e2e8f0;font-size:12px}
  tr:nth-child(even) td{background:#f8fafc}
  .warn{color:#dc2626;font-weight:600}.ok{color:#16a34a;font-weight:600}
  .note{background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:12px 16px;font-size:12px;line-height:1.6;margin:12px 0}
  .footer{margin-top:40px;font-size:11px;color:#94a3b8;border-top:1px solid #e5e7eb;padding-top:16px}
  @media print{body{padding:20px}}
</style></head><body>
<h1>UniStat — Аналитический отчёт по качеству среды</h1>
<p class="sub">КГТУ им. И. Раззакова · Сформировано: ${now}</p>
<h2>1. Текущее состояние параметров (момент экспорта)</h2>
<table>
  <tr><th>Параметр</th><th>Датчик</th><th>Значение</th><th>Норма (ВОЗ / СанПиН)</th><th>Отклонение</th></tr>
  <tr><td>PM2.5</td><td>GP2Y1014AU</td><td class="${telemetry.pm25>25?"warn":"ok"}">${telemetry.pm25} мкг/м³</td><td>≤15 мкг/м³ (ВОЗ)</td><td class="${telemetry.pm25>15?"warn":"ok"}">${((telemetry.pm25/15-1)*100).toFixed(0)}% выше нормы</td></tr>
  <tr><td>CO₂ / TVOC</td><td>SGP30</td><td class="${telemetry.co2>1000?"warn":"ok"}">${telemetry.co2} ppm</td><td>&lt;1000 ppm</td><td class="${telemetry.co2>1000?"warn":"ok"}">${telemetry.co2>1000?"+"+String(telemetry.co2-1000)+" ppm":"В норме"}</td></tr>
  <tr><td>Освещённость</td><td>TCS34725</td><td>${telemetry.lux} лк</td><td>300–500 лк</td><td>${telemetry.lux<300?(300-telemetry.lux)+" лк ниже":telemetry.lux>500?(telemetry.lux-500)+" лк выше":"В норме"}</td></tr>
  <tr><td>Температура</td><td>DHT22</td><td>${telemetry.temp}°C</td><td>20–22°C</td><td>${telemetry.temp>=20&&telemetry.temp<=22?"В норме":"Отклонение"}</td></tr>
  <tr><td>Влажность</td><td>DHT22</td><td>${telemetry.humidity}%</td><td>40–60%</td><td>${telemetry.humidity>=40&&telemetry.humidity<=60?"В норме":"Отклонение"}</td></tr>
  <tr><td>Нагрузка</td><td>ACS712</td><td>${telemetry.powerKw} кВт</td><td>—</td><td>Сутки: ${kwhToday.toFixed(2)} кВт·ч</td></tr>
</table>
<h2>2. Архивная сводка (последние ${rows.length} записей)</h2>
<div class="note">
  Средний PM2.5: <strong>${avgPm25} мкг/м³</strong> — превышение ВОЗ на <strong class="warn">${pm25ExceedPct}%</strong>.
  Средний CO₂: <strong>${avgCo2} ppm</strong>. Среднее потребление: <strong>${avgKw} кВт</strong>.
</div>
<table>
  <tr><th>Дата/время</th><th>PM2.5</th><th>CO₂</th><th>Темп.</th><th>Нагрузка</th></tr>
  ${rows.map(d=>`<tr><td>${new Date(d.ts).toLocaleString("ru-RU")}</td><td class="${d.pm25>25?"warn":"ok"}">${d.pm25}</td><td class="${d.co2>1000?"warn":"ok"}">${d.co2}</td><td>${d.temp}°C</td><td>${d.powerKw} кВт</td></tr>`).join("")}
</table>
<h2>3. Сводка по соответствию нормам</h2>
<div class="note">
  Система UniStat обеспечивает непрерывный мониторинг 5 физических параметров среды в реальном времени.
  Данные свидетельствуют о необходимости активного управления качеством воздуха в учебных помещениях КГТУ.
</div>
<div class="footer">Отчёт сформирован системой UniStat v3.0 · Факультет компьютерных технологий и управления, КГТУ им. И. Раззакова · 2025–2026</div>
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ──────────────────────────────────────────────────────────────────────────────
// Эталонная структура документа управления (classroom/state) — для relay writes
// ──────────────────────────────────────────────────────────────────────────────

const FIRESTORE_SEED = {
  telemetry:    { pm25: 0, co2: 0, lux: 0, temp: 0, humidity: 0, powerKw: 0 },
  relays:       { ventilation: false, sockets: false, lightGroups: 0 },
  schedule:     { off: "21:00", on: "08:00" },
  daily_energy: 0,
}

// ──────────────────────────────────────────────────────────────────────────────
// Детерминированный засев архива — 28 записей, май 1–7, 2026
// 4 снимка в сутки (06:00 / 12:00 / 18:00 / 00:00 по Бишкеку UTC+6)
// pm25 и co2 строго в диапазоне 0–100 (нормализованная шкала)
// ──────────────────────────────────────────────────────────────────────────────

function buildArchiveSeed(): Omit<ArchiveEntry, "id">[] {
  // Индексы 0–6 соответствуют 1 мая – 7 мая 2026

  // 06:00 local (UTC 00:00) — утро, низкая активность
  const mornPm25 = [12, 15, 10, 18, 14, 11, 16]
  const mornCo2  = [10, 12,  8, 15, 11,  9, 13]
  const mornLux  = [ 0,  0,  0,  0,  0,  0,  0]
  const mornTemp = [17.5, 17.8, 17.2, 18.0, 17.6, 17.3, 17.9]
  const mornHum  = [55, 54, 56, 57, 53, 55, 54]
  const mornKw   = [0, 0, 0, 0, 0, 0, 0]

  // 12:00 local (UTC 06:00) — пик активности
  const noonPm25 = [72, 68, 75, 80, 65, 78, 70]
  const noonCo2  = [85, 78, 90, 95, 72, 88, 82]
  const noonLux  = [85, 78, 90, 82, 75, 88, 80]
  const noonTemp = [21.2, 20.8, 21.5, 21.8, 20.5, 21.4, 21.0]
  const noonHum  = [48, 47, 49, 50, 46, 48, 47]
  const noonKw   = [0.85, 0.80, 0.90, 0.95, 0.78, 0.88, 0.82]

  // 18:00 local (UTC 12:00) — послеполудень, спад
  const aftrPm25 = [55, 48, 60, 65, 45, 62, 52]
  const aftrCo2  = [65, 58, 70, 75, 52, 72, 62]
  const aftrLux  = [60, 55, 65, 58, 50, 62, 56]
  const aftrTemp = [22.5, 22.0, 23.0, 23.2, 21.8, 22.8, 22.2]
  const aftrHum  = [45, 44, 46, 47, 43, 45, 44]
  const aftrKw   = [0.72, 0.65, 0.78, 0.82, 0.60, 0.75, 0.68]

  // 00:00 local (UTC 18:00) — ночь
  const ngtPm25 = [18, 20, 16, 22, 15, 19, 17]
  const ngtCo2  = [15, 18, 12, 20, 10, 16, 14]
  const ngtTemp = [19.5, 19.2, 19.8, 20.0, 19.0, 19.6, 19.3]
  const ngtHum  = [52, 51, 53, 54, 50, 52, 51]

  const dailyEnergy = [5.2, 4.8, 5.6, 5.9, 4.5, 5.4, 5.0]

  const entries: Omit<ArchiveEntry, "id">[] = []

  for (let i = 0; i < 7; i++) {
    const base = new Date(Date.UTC(2026, 4, 1 + i)) // May 1–7

    // 06:00 Bishkek = UTC 00:00
    const t1 = new Date(base); t1.setUTCHours(0, 0, 0, 0)
    entries.push({
      timestamp: t1.toISOString(), ts: t1.getTime(),
      pm25: mornPm25[i], co2: mornCo2[i], lux: mornLux[i],
      temp: mornTemp[i], humidity: mornHum[i], powerKw: mornKw[i],
      relays: { ventilation: false, sockets: false, lightGroups: 0 },
      daily_energy: dailyEnergy[i],
    })

    // 12:00 Bishkek = UTC 06:00
    const t2 = new Date(base); t2.setUTCHours(6, 0, 0, 0)
    entries.push({
      timestamp: t2.toISOString(), ts: t2.getTime(),
      pm25: noonPm25[i], co2: noonCo2[i], lux: noonLux[i],
      temp: noonTemp[i], humidity: noonHum[i], powerKw: noonKw[i],
      relays: { ventilation: true, sockets: true, lightGroups: 3 },
      daily_energy: dailyEnergy[i],
    })

    // 18:00 Bishkek = UTC 12:00
    const t3 = new Date(base); t3.setUTCHours(12, 0, 0, 0)
    entries.push({
      timestamp: t3.toISOString(), ts: t3.getTime(),
      pm25: aftrPm25[i], co2: aftrCo2[i], lux: aftrLux[i],
      temp: aftrTemp[i], humidity: aftrHum[i], powerKw: aftrKw[i],
      relays: { ventilation: true, sockets: true, lightGroups: 2 },
      daily_energy: dailyEnergy[i],
    })

    // 00:00+1 Bishkek = UTC 18:00
    const t4 = new Date(base); t4.setUTCHours(18, 0, 0, 0)
    entries.push({
      timestamp: t4.toISOString(), ts: t4.getTime(),
      pm25: ngtPm25[i], co2: ngtCo2[i], lux: 0,
      temp: ngtTemp[i], humidity: ngtHum[i], powerKw: 0,
      relays: { ventilation: false, sockets: false, lightGroups: 0 },
      daily_energy: dailyEnergy[i],
    })
  }

  return entries.sort((a, b) => a.ts - b.ts)
}

// ──────────────────────────────────────────────────────────────────────────────
// Основной компонент
// ──────────────────────────────────────────────────────────────────────────────

export default function UniStatDashboard() {

  // ── Навигация ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("control")

  // ── Архив телеметрии (пусто до загрузки) ──────────────────────────────────
  const [archive, setArchive] = useState<ArchiveEntry[]>([])
  const [isLoadingArchive, setIsLoadingArchive] = useState(true)
  const [firestoreError, setFirestoreError]     = useState<string | null>(null)

  // ── Нулевые начальные состояния (строго 0 до прихода данных) ──────────────
  const [kwhToday, setKwhToday]   = useState(0)
  const [relays, setRelays]       = useState({ ventilation: false, sockets: false, lightGroups: 0 })
  const [scheduleOff, setScheduleOff] = useState("21:00")
  const [scheduleOn,  setScheduleOn]  = useState("08:00")

  // ── Журнал событий ──────────────────────────────────────────────────────────
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  // ── Ручной приоритет ────────────────────────────────────────────────────────
  const [overrideActive,    setOverrideActive]    = useState(false)
  const [overrideCountdown, setOverrideCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Флаги отправки ──────────────────────────────────────────────────────────
  const [isSendingVentilation, setIsSendingVentilation] = useState(false)
  const [isSendingSockets,     setIsSendingSockets]     = useState(false)
  const [isSendingLights,      setIsSendingLights]      = useState(false)

  // ── Фильтр по дате (аналитика) ──────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>("")

  // ── Дебаунс-рефы ────────────────────────────────────────────────────────────
  const ventDebounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const socketsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lightsDebounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ────────────────────────────────────────────────────────────────────────────
  // FETCH ARCHIVE: читает classroom_history, сортирует по ts asc.
  // Если коллекция пуста — засевает 25 детерминированных записей и перечитывает.
  // ────────────────────────────────────────────────────────────────────────────
  const fetchDataArchive = useCallback(async () => {
    try {
      setIsLoadingArchive(true)
      setFirestoreError(null)

      const colRef = collection(db, HISTORY_COLLECTION)
      const q      = query(colRef, orderBy("ts", "desc"), limit(50))
      const snap   = await getDocs(q)

      let rows: ArchiveEntry[]

      if (snap.empty) {
        // ── AUTO-SEED ──────────────────────────────────────────────────────────
        const seedEntries = buildArchiveSeed()
        for (const entry of seedEntries) {
          await addDoc(colRef, entry)
        }
        console.info(`[UniStat] ${HISTORY_COLLECTION} was empty — seeded ${seedEntries.length} archive entries.`)

        // Re-fetch after seed
        const reSnap = await getDocs(q)
        rows = reSnap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<ArchiveEntry, "id">) }))
          .sort((a, b) => a.ts - b.ts)
      } else {
        rows = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<ArchiveEntry, "id">) }))
          .sort((a, b) => a.ts - b.ts)
      }

      setArchive(rows)

      // Apply latest entry to control states
      if (rows.length > 0) {
        const latest = rows[rows.length - 1]
        setRelays({ ...latest.relays })
        setKwhToday(latest.daily_energy)

        const ts = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        setLogEntries([{
          ts,
          raw: `Архив загружен из ${HISTORY_COLLECTION}: ${rows.length} записей. Последняя: ${new Date(latest.ts).toLocaleString("ru-RU")}. PM2.5=${latest.pm25} мкг/м³, CO₂=${latest.co2} ppm.`,
          deviation: 0,
          worse: false,
        }])
      }

    } catch (err) {
      console.error("[UniStat] fetchDataArchive error:", err)
      setFirestoreError(
        "Не удалось загрузить архив из Firestore. Проверьте подключение и правила безопасности базы данных."
      )
    } finally {
      setIsLoadingArchive(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Загрузка при монтировании
  useEffect(() => { fetchDataArchive() }, [fetchDataArchive])

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (ventDebounceRef.current)    clearTimeout(ventDebounceRef.current)
      if (socketsDebounceRef.current) clearTimeout(socketsDebounceRef.current)
      if (lightsDebounceRef.current)  clearTimeout(lightsDebounceRef.current)
      if (countdownRef.current)       clearInterval(countdownRef.current)
    }
  }, [])

  // Автопрокрутка журнала
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logEntries])

  // ── Ручной приоритет (2 часа) ─────────────────────────────────────────────
  const triggerOverride = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setOverrideActive(true)
    setOverrideCountdown(MANUAL_OVERRIDE_SECONDS)
    toast.warning("Ручной приоритет активирован", {
      description: "Автономные алгоритмы UniStat приостановлены на 2 часа.",
      duration: 6000,
    })
    countdownRef.current = setInterval(() => {
      setOverrideCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          setOverrideActive(false)
          toast.success("Автономный режим восстановлен", {
            description: "UniStat возобновил управление по данным датчиков.",
            duration: 5000,
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // ── Переключение реле ─────────────────────────────────────────────────────
  const toggleRelay = (key: "ventilation" | "sockets", value: boolean) => {
    setRelays(prev => ({ ...prev, [key]: value }))
    triggerOverride()

    const ts = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    setLogEntries(l => [
      ...l.slice(-14),
      { ts, raw: `Команда реле: ${key}=${value?"ON":"OFF"} → Узел 2 (Wemos D1 Mini). Ручной приоритет активирован.`, deviation: 0, worse: false },
    ])

    if (key === "ventilation") {
      if (ventDebounceRef.current) clearTimeout(ventDebounceRef.current)
      setIsSendingVentilation(true)
      ventDebounceRef.current = setTimeout(async () => {
        try {
          await updateDoc(doc(db, CLASSROOM_COLLECTION, CLASSROOM_DOC_ID), { "relays.ventilation": value })
        } catch (err) {
          console.error("[UniStat] Firestore write error (ventilation):", err)
          toast.error("Ошибка записи в Firestore (вентиляция)")
        } finally { setIsSendingVentilation(false) }
      }, DEBOUNCE_TOGGLE_MS)
    } else {
      if (socketsDebounceRef.current) clearTimeout(socketsDebounceRef.current)
      setIsSendingSockets(true)
      socketsDebounceRef.current = setTimeout(async () => {
        try {
          await updateDoc(doc(db, CLASSROOM_COLLECTION, CLASSROOM_DOC_ID), { "relays.sockets": value })
        } catch (err) {
          console.error("[UniStat] Firestore write error (sockets):", err)
          toast.error("Ошибка записи в Firestore (розетки)")
        } finally { setIsSendingSockets(false) }
      }, DEBOUNCE_TOGGLE_MS)
    }
  }

  // ── Слайдер освещения ─────────────────────────────────────────────────────
  const setLightGroups = (val: number) => {
    if (val === relays.lightGroups) return
    setRelays(prev => ({ ...prev, lightGroups: val }))
    triggerOverride()
    if (lightsDebounceRef.current) clearTimeout(lightsDebounceRef.current)
    setIsSendingLights(true)
    lightsDebounceRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, CLASSROOM_COLLECTION, CLASSROOM_DOC_ID), { "relays.lightGroups": val })
      } catch (err) {
        console.error("[UniStat] Firestore write error (lightGroups):", err)
        toast.error("Ошибка записи в Firestore (освещение)")
      } finally { setIsSendingLights(false) }
    }, DEBOUNCE_SLIDER_MS)
  }

  // ── Производные значения ───────────────────────────────────────────────────
  const latestEntry  = archive.length > 0 ? archive[archive.length - 1] : null
  const prevEntry    = archive.length >= 2 ? archive[archive.length - 2] : null

  const telemetry: TelemetrySnap = latestEntry
    ? { ts: latestEntry.ts, pm25: latestEntry.pm25, co2: latestEntry.co2,
        lux: latestEntry.lux, temp: latestEntry.temp,
        humidity: latestEntry.humidity, powerKw: latestEntry.powerKw }
    : ZERO_SNAP

  const prevSnap: TelemetrySnap | null = prevEntry
    ? { ts: prevEntry.ts, pm25: prevEntry.pm25, co2: prevEntry.co2,
        lux: prevEntry.lux, temp: prevEntry.temp,
        humidity: prevEntry.humidity, powerKw: prevEntry.powerKw }
    : null

  const ventRec    = useMemo(() => computeVentRec(telemetry.pm25, telemetry.co2), [telemetry.pm25, telemetry.co2])
  const kwhProgress  = Math.min((kwhToday / KWH_DAILY_WARN) * 100, 100)
  const kwhOverLimit = kwhToday >= KWH_DAILY_WARN

  // Фильтрация архива по выбранной дате (сравниваем YYYY-MM-DD по локальному времени)
  const filteredArchive: ArchiveEntry[] = useMemo(() => {
    if (!selectedDate) return archive
    return archive.filter(e => {
      const d = new Date(e.ts)
      const localDate =
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      return localDate === selectedDate
    })
  }, [archive, selectedDate])

  // Для метрических карточек и графиков используем отфильтрованный набор
  const displayArchive = filteredArchive

  // Chart data — mapped to recharts shape, ascending order already guaranteed
  const toChartPoint = (e: ArchiveEntry) => ({
    label:    new Date(e.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    pm25:     e.pm25,
    co2:      e.co2,
    lux:      e.lux,
    temp:     e.temp,
    humidity: e.humidity,
    kw:       e.powerKw,
  })
  const chartData = displayArchive.map(toChartPoint)

  // ── Навигация боковой панели ───────────────────────────────────────────────
  const sideNav = [
    { key: "control"      as ActiveTab, icon: LayoutDashboard, label: "Управление" },
    { key: "analytics"    as ActiveTab, icon: BarChart2,        label: "Аналитика и история" },
    { key: "architecture" as ActiveTab, icon: Settings,         label: "Архитектура" },
    { key: "team"         as ActiveTab, icon: Users,            label: "Команда" },
  ]

  // ── Экран загрузки ─────────────────────────────────────────────────────────
  if (isLoadingArchive) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Database className="h-6 w-6 text-muted-foreground" />
            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
          <p className="text-sm font-medium text-foreground">Загрузка архива из Firestore...</p>
          <p className="text-xs text-muted-foreground">classroom_history · limit 50</p>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Рендер
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Toaster richColors position="top-right" />

      {/* ════════════════════════════════════════════════════════════════════
          БОКОВАЯ ПАНЕЛЬ
      ═════════════════════════════════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 border-r border-border flex flex-col bg-background">
        <div className="h-14 flex items-center gap-3 px-4 border-b border-border shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground shrink-0">
            <Cpu className="h-4 w-4 text-background" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold leading-tight tracking-tight">UniStat</div>
            <div className="text-[9px] text-muted-foreground tracking-wider truncate">
              ROOM ANALYSIS AND MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Навигация
          </p>
          {sideNav.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                activeTab === key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-border space-y-1.5 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Статус узлов
          </p>
          {["Узел 1 (ESP32)", "Узел 2 (Wemos D1)"].map(n => (
            <div key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
              <span className="truncate">{n}: онлайн</span>
            </div>
          ))}
          <button
            onClick={fetchDataArchive}
            className="mt-2 w-full flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3 shrink-0" />
            Обновить из Firestore
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-mono">
            <Database className="h-3 w-3 shrink-0" />
            {archive.length} записей в архиве
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════════
          ОСНОВНОЕ СОДЕРЖИМОЕ
      ═════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-6">

          {firestoreError && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800">{firestoreError}</p>
              </div>
              <button onClick={() => setFirestoreError(null)}
                className="text-amber-500 hover:text-amber-700 text-xs shrink-0">✕</button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ВКЛАДКА 1 — УПРАВЛЕНИЕ АУДИТОРИЕЙ
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "control" && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Room Analysis &amp; Management System</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Последняя запись архива · {latestEntry ? new Date(latestEntry.ts).toLocaleString("ru-RU") : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono shrink-0">
                  <Database className="h-3 w-3" />
                  {archive.length} записей
                </div>
              </div>

              {overrideActive && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <Timer className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-amber-800">Ручной приоритет активен.</span>
                    <span className="ml-2 text-amber-700 text-sm">Автономные алгоритмы приостановлены.</span>
                  </div>
                  <div className="font-mono text-xl font-bold text-amber-700 tabular-nums shrink-0">
                    {fmtHMS(overrideCountdown)}
                  </div>
                </div>
              )}

              {/* ── БЛОК 1: Телеметрия ──────────────────────────────────────── */}
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Телеметрия · последняя запись архива
                </h2>

                <TooltipProvider>
                  <div className="grid grid-cols-5 gap-3">

                    {/* PM2.5 */}
                    {(() => {
                      const bad = telemetry.pm25 > 55, mid = telemetry.pm25 > 25
                      const cls = bad ? "border-red-200 bg-red-50/50" : mid ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"
                      const txt = bad ? "text-red-700" : mid ? "text-amber-700" : "text-green-700"
                      return (
                        <Card className={cls}>
                          <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <CloudFog className={`h-3.5 w-3.5 ${txt}`} />
                                <span className="text-xs font-semibold">PM2.5</span>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent side="bottom" className="z-50">
                                  <MetricTooltip
                                    standard="ВОЗ: ≤15 мкг/м³ (24ч среднесут.); ≤25 мкг/м³ (допустимый)"
                                    deviation={`+${((telemetry.pm25 / 15 - 1) * 100).toFixed(0)}% выше нормы ВОЗ`}
                                    tolerance="±10% (GP2Y1014AU, оптический счётчик частиц, ≥0.8 мкм)"
                                    extra="Бишкек, зима: PM2.5 в помещении 50–80 мкг/м³ из-за проникновения угольного смога."
                                  />
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className={`text-2xl font-bold tabular-nums ${txt}`}>{telemetry.pm25}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">мкг/м³</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">GP2Y1014AU</div>
                            {prevSnap && (() => {
                              const d = pctDiff(telemetry.pm25, prevSnap.pm25)
                              return (
                                <div className={`text-[10px] mt-1 flex items-center gap-0.5 ${d > 0 ? "text-red-500" : "text-green-600"}`}>
                                  {d > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                  {Math.abs(d)}%
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      )
                    })()}

                    {/* CO2/TVOC */}
                    {(() => {
                      const bad = telemetry.co2 > 1000, mid = telemetry.co2 > 800
                      const cls = bad ? "border-red-200 bg-red-50/50" : mid ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"
                      const txt = bad ? "text-red-700" : mid ? "text-amber-700" : "text-green-700"
                      return (
                        <Card className={cls}>
                          <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <Activity className={`h-3.5 w-3.5 ${txt}`} />
                                <span className="text-xs font-semibold">CO₂/TVOC</span>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent side="bottom" className="z-50">
                                  <MetricTooltip
                                    standard="Наружный: ~420 ppm. Комфорт: <1000 ppm. Критический: >2000 ppm"
                                    deviation={telemetry.co2 > 1000 ? `+${telemetry.co2 - 1000} ppm выше порога` : `${1000 - telemetry.co2} ppm до порога`}
                                    tolerance="±50 ppm CO₂экв (SGP30, MOX мультипиксельный газовый сенсор, также TVOC)"
                                  />
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className={`text-2xl font-bold tabular-nums ${txt}`}>{telemetry.co2}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">ppm CO₂экв</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">SGP30</div>
                            {prevSnap && (() => {
                              const d = pctDiff(telemetry.co2, prevSnap.co2)
                              return (
                                <div className={`text-[10px] mt-1 flex items-center gap-0.5 ${d > 0 ? "text-red-500" : "text-green-600"}`}>
                                  {d > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                  {Math.abs(d)}%
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      )
                    })()}

                    {/* Освещённость */}
                    {(() => {
                      const off = telemetry.lux < 200 || telemetry.lux > 600
                      const cls = off ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"
                      const txt = off ? "text-amber-700" : "text-green-700"
                      return (
                        <Card className={cls}>
                          <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <Sun className={`h-3.5 w-3.5 ${txt}`} />
                                <span className="text-xs font-semibold">Свет</span>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent side="bottom" className="z-50">
                                  <MetricTooltip
                                    standard="СанПиН 2.4.2.2821-10: 300–500 лк для учебных помещений"
                                    deviation={telemetry.lux < 300 ? `${300 - telemetry.lux} лк ниже нормы` : telemetry.lux > 500 ? `${telemetry.lux - 500} лк выше нормы` : "В пределах нормы"}
                                    tolerance="±5% (TCS34725, фотодиод 16-бит, каналы RGB+Clear)"
                                  />
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className={`text-2xl font-bold tabular-nums ${txt}`}>{telemetry.lux}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">лк</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">TCS34725</div>
                          </CardContent>
                        </Card>
                      )
                    })()}

                    {/* Температура */}
                    {(() => {
                      const off = telemetry.temp < 19 || telemetry.temp > 23
                      const cls = off ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"
                      const txt = off ? "text-amber-700" : "text-green-700"
                      return (
                        <Card className={cls}>
                          <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <Thermometer className={`h-3.5 w-3.5 ${txt}`} />
                                <span className="text-xs font-semibold">Темп.</span>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent side="bottom" className="z-50">
                                  <MetricTooltip
                                    standard="СанПиН: 20–22°C для учебных помещений (зима)"
                                    deviation={`${telemetry.temp < 20 ? (telemetry.temp - 20).toFixed(1) : "+" + (telemetry.temp - 22).toFixed(1)}°C от нормы`}
                                    tolerance="±0.5°C (DHT22, ёмкостной датчик)"
                                  />
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className={`text-2xl font-bold tabular-nums ${txt}`}>{telemetry.temp}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">°C</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">DHT22</div>
                          </CardContent>
                        </Card>
                      )
                    })()}

                    {/* Влажность */}
                    {(() => {
                      const off = telemetry.humidity < 35 || telemetry.humidity > 65
                      const cls = off ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"
                      const txt = off ? "text-amber-700" : "text-green-700"
                      return (
                        <Card className={cls}>
                          <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <Droplets className={`h-3.5 w-3.5 ${txt}`} />
                                <span className="text-xs font-semibold">Влажн.</span>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                <TooltipContent side="bottom" className="z-50">
                                  <MetricTooltip
                                    standard="Оптимальный диапазон: 40–60% (ASHRAE 55)"
                                    deviation={telemetry.humidity < 40 ? `${40 - telemetry.humidity}% ниже оптимума` : telemetry.humidity > 60 ? `${telemetry.humidity - 60}% выше оптимума` : "В норме"}
                                    tolerance="±5% (DHT22, ёмкостной датчик влажности)"
                                  />
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className={`text-2xl font-bold tabular-nums ${txt}`}>{telemetry.humidity}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">%</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">DHT22</div>
                          </CardContent>
                        </Card>
                      )
                    })()}
                  </div>
                </TooltipProvider>

                {/* Счётчик суточного потребления */}
                <Card>
                  <CardContent className="pt-4 pb-4 px-5">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-secondary">
                          <Zap className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Суточное потребление электроэнергии
                          </div>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className={`text-3xl font-bold tabular-nums ${kwhOverLimit ? "text-red-600" : "text-foreground"}`}>
                              {kwhToday.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground">кВт·ч</span>
                            <span className="text-xs text-muted-foreground">/ {KWH_DAILY_WARN} кВт·ч лимит</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 max-w-xs space-y-1.5">
                        <Progress value={kwhProgress}
                          className={`h-2 ${kwhOverLimit ? "[&>div]:bg-red-500" : "[&>div]:bg-foreground"}`} />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Нагрузка: {telemetry.powerKw} кВт</span>
                          <span>Тариф: 1.68 сом/кВт·ч · Стоимость: {(kwhToday * 1.68).toFixed(2)} сом</span>
                        </div>
                      </div>
                      {kwhOverLimit && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium shrink-0">
                          <AlertTriangle className="h-4 w-4" />
                          Порог превышен
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* ── БЛОК 2: Реле ────────────────────────────────────────────── */}
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Radio className="h-3.5 w-3.5" />
                  Исполнительные реле (Wemos D1 Mini)
                </h2>

                <div className="grid grid-cols-3 gap-4">

                  {/* Вентиляция */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${relays.ventilation ? "bg-green-100" : "bg-secondary"}`}>
                            <Wind className={`h-4 w-4 ${relays.ventilation ? "text-green-600" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <CardTitle className="text-sm">Вентиляция воздуха</CardTitle>
                            <CardDescription className="text-xs">Реле 1 · HEPA H13 + канальный вентилятор</CardDescription>
                          </div>
                        </div>
                        <Badge variant={relays.ventilation ? "default" : "secondary"} className="flex items-center gap-1">
                          {isSendingVentilation
                            ? <><RefreshCw className="h-2.5 w-2.5 animate-spin" />Отправка...</>
                            : relays.ventilation ? "ВКЛ" : "ВЫКЛ"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant={relays.ventilation ? "default" : "outline"} className="flex-1 gap-1.5"
                          onClick={() => toggleRelay("ventilation", true)} disabled={relays.ventilation || isSendingVentilation}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> ВКЛ
                        </Button>
                        <Button size="sm" variant={!relays.ventilation ? "destructive" : "outline"} className="flex-1 gap-1.5"
                          onClick={() => toggleRelay("ventilation", false)} disabled={!relays.ventilation || isSendingVentilation}>
                          <XCircle className="h-3.5 w-3.5" /> ВЫКЛ
                        </Button>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-800 leading-relaxed">
                        <p className="font-semibold mb-1">Анализ фильтра (предиктивная модель):</p>
                        <p>
                          Расчётное время очистки объёма помещения фильтром: <strong>{ventRec.clearMin} мин.</strong> Рекомендуемое
                          время работы: <strong>{ventRec.recMin} минут</strong>, с последующим автоматическим отключением.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Освещение */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${relays.lightGroups > 0 ? "bg-yellow-100" : "bg-secondary"}`}>
                          <Lightbulb className={`h-4 w-4 ${relays.lightGroups > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm">Группы диммирования освещения</CardTitle>
                          <CardDescription className="text-xs">Реле 2–5 · Оверрайд датчика TCS34725</CardDescription>
                        </div>
                        <Badge variant="outline" className="font-mono shrink-0 flex items-center gap-1">
                          {isSendingLights
                            ? <><RefreshCw className="h-2.5 w-2.5 animate-spin" />...</>
                            : `${relays.lightGroups} / 4`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <Slider min={0} max={4} step={1} value={[relays.lightGroups]}
                        onValueChange={([v]) => setLightGroups(v)} />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-0.5">
                        {[0, 1, 2, 3, 4].map(n => (
                          <span key={n} className={n === relays.lightGroups ? "font-bold text-foreground" : ""}>{n}</span>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        0 = все выкл. · 4 = все группы активны. Отменяет автономную логику диммирования по датчику TCS34725.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Умные розетки */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${relays.sockets ? "bg-blue-50" : "bg-secondary"}`}>
                            <Power className={`h-4 w-4 ${relays.sockets ? "text-blue-600" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <CardTitle className="text-sm">Умные розетки 220В</CardTitle>
                            <CardDescription className="text-xs">Реле 6 · Датчик тока ACS712</CardDescription>
                          </div>
                        </div>
                        <Badge variant={relays.sockets ? "default" : "destructive"} className="flex items-center gap-1">
                          {isSendingSockets
                            ? <><RefreshCw className="h-2.5 w-2.5 animate-spin" />Отправка...</>
                            : relays.sockets ? "ВКЛ" : "ВЫКЛ"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant={relays.sockets ? "default" : "outline"} className="flex-1 gap-1.5"
                          onClick={() => toggleRelay("sockets", true)} disabled={relays.sockets || isSendingSockets}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> ВКЛ
                        </Button>
                        <Button size="sm" variant={!relays.sockets ? "destructive" : "outline"} className="flex-1 gap-1.5"
                          onClick={() => toggleRelay("sockets", false)} disabled={!relays.sockets || isSendingSockets}>
                          <XCircle className="h-3.5 w-3.5" /> ВЫКЛ
                        </Button>
                      </div>
                      <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium">Автоматическое расписание</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">Отключение (ВЫКЛ)</label>
                            <input type="time" value={scheduleOff} onChange={e => setScheduleOff(e.target.value)}
                              className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">Включение (ВКЛ)</label>
                            <input type="time" value={scheduleOn} onChange={e => setScheduleOn(e.target.value)}
                              className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Расписание: отключение в <strong>{scheduleOff}</strong>, включение в <strong>{scheduleOn}</strong>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ── БЛОК 3: Журнал событий ──────────────────────────────────── */}
              <section>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                      <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Журнал событий · Узел 1 → UniStat
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div ref={logRef}
                      className="h-36 overflow-y-auto rounded bg-muted/60 p-3 space-y-1 font-mono text-[11px]">
                      {logEntries.length === 0 && (
                        <p className="text-muted-foreground">Ожидание событий...</p>
                      )}
                      {logEntries.map((entry, i) => {
                        const isLatest = i === logEntries.length - 1
                        const indicator = entry.deviation < 0.3
                          ? <span className="text-muted-foreground">○</span>
                          : entry.worse
                          ? <span className="text-red-500">🔴</span>
                          : <span className="text-green-600">🟢</span>
                        return (
                          <div key={i}
                            className={`flex items-start gap-2 leading-relaxed ${isLatest ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            <span className="text-muted-foreground/60 shrink-0">[{entry.ts}]</span>
                            <span className="flex-1">{entry.raw}</span>
                            {indicator}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ВКЛАДКА 2 — АНАЛИТИКА И ИСТОРИЯ
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Аналитика и история</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Архив classroom_history · {archive.length} записей · май 2026
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => exportPDF(telemetry, archive, kwhToday)}>
                  <FileDown className="h-3.5 w-3.5" />
                  Экспорт PDF
                </Button>
              </div>

              {/* ── Просмотр конкретной даты ──────────────────────────────── */}
              <Card>
                <CardContent className="pt-4 pb-4 px-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">Просмотр конкретной даты</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={selectedDate}
                        min="2026-05-01"
                        max="2026-05-07"
                        onChange={e => setSelectedDate(e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {selectedDate && (
                        <Button size="sm" variant="ghost" className="text-muted-foreground h-8"
                          onClick={() => setSelectedDate("")}>
                          Сбросить
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedDate
                        ? filteredArchive.length > 0
                          ? `${filteredArchive.length} записей за ${new Date(selectedDate + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`
                          : "Нет данных за выбранный период"
                        : `Показаны все ${archive.length} записей`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Графики и таблица — только когда есть записи */}
              {displayArchive.length > 0 && (<>
              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CloudFog className="h-4 w-4" /> PM2.5 — GP2Y1014AU
                    </CardTitle>
                    <CardDescription className="text-xs">ВОЗ ≤15 мкг/м³ · хронологический архив</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                        <RechartsTip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [`${v} мкг/м³`, "PM2.5"]} />
                        <Line type="monotone" dataKey="pm25" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" /> CO₂ / TVOC — SGP30
                    </CardTitle>
                    <CardDescription className="text-xs">Комфорт &lt;1000 ppm · хронологический архив</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                        <RechartsTip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [`${v} ppm`, "CO₂"]} />
                        <Line type="monotone" dataKey="co2" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Thermometer className="h-4 w-4" /> Температура и влажность — DHT22
                    </CardTitle>
                    <CardDescription className="text-xs">°C (оранжевый) · % (голубой)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                        <RechartsTip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number, n: string) => [`${v}${n === "temp" ? "°C" : "%"}`, n === "temp" ? "Температура" : "Влажность"]} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }}
                          formatter={(v) => v === "temp" ? "Температура (°C)" : "Влажность (%)"} />
                        <Line type="monotone" dataKey="temp"     stroke="#f97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sun className="h-4 w-4" /> Освещённость — TCS34725
                    </CardTitle>
                    <CardDescription className="text-xs">Норма 300–500 лк</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="luxGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                        <RechartsTip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [`${v} лк`, "Освещённость"]} />
                        <Area type="monotone" dataKey="lux" stroke="#fbbf24" strokeWidth={2} fill="url(#luxGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Потребление электроэнергии — ACS712
                    </CardTitle>
                    <CardDescription className="text-xs">кВт · PZEM-004T v3.0</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="kwGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#64748b" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                        <RechartsTip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [`${v} кВт`, "Нагрузка"]} />
                        <Area type="monotone" dataKey="kw" stroke="#64748b" strokeWidth={2} fill="url(#kwGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* ── Плейсхолдер «нет данных» ────────────────────────────── */}
              {selectedDate && filteredArchive.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
                  <Database className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">Нет данных за выбранный период</p>
                  <p className="text-xs text-muted-foreground/60">
                    Выберите дату в диапазоне 1–7 мая 2026 или сбросьте фильтр
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setSelectedDate("")}>
                    Показать весь архив
                  </Button>
                </div>
              )}

              {/* Таблица архива */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Архив classroom_history
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {displayArchive.length} записей
                    {selectedDate
                      ? ` · ${new Date(selectedDate + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`
                      : " · май 1–7, 2026"}
                    {" · сортировка по убыванию"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Дата / время</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">PM2.5</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">CO₂</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Лк</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Темп.</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Влажн.</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">кВт</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">кВт·ч</th>
                          <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Реле</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...displayArchive].reverse().map((e) => (
                          <tr key={e.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">
                              {new Date(e.ts).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className={`px-3 py-1.5 text-right tabular-nums ${e.pm25 > 55 ? "text-red-600 font-medium" : e.pm25 > 25 ? "text-amber-600" : "text-green-700"}`}>
                              {e.pm25}
                            </td>
                            <td className={`px-3 py-1.5 text-right tabular-nums ${e.co2 > 1000 ? "text-red-600 font-medium" : e.co2 > 800 ? "text-amber-600" : "text-green-700"}`}>
                              {e.co2}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{e.lux}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{e.temp}°C</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{e.humidity}%</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{e.powerKw}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{e.daily_energy}</td>
                            <td className="px-3 py-1.5 text-center">
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${e.relays.ventilation ? "bg-green-500" : "bg-muted-foreground/30"}`} title="Вентиляция" />
                              {" "}
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${e.relays.sockets ? "bg-blue-500" : "bg-muted-foreground/30"}`} title="Розетки" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              </> /* end displayArchive.length > 0 */
              )/* end displayArchive conditional */}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ВКЛАДКА 3 — АРХИТЕКТУРА
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "architecture" && (
            <>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Архитектура системы</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Локальная аппаратная петля управления · без внешних облачных зависимостей
                </p>
              </div>

              {kwhOverLimit && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">Суточный порог потребления превышен.</span>{" "}
                    Накоплено <strong>{kwhToday.toFixed(2)} кВт·ч</strong> из {KWH_DAILY_WARN} кВт·ч.
                    Рекомендуется отключение некритичных нагрузок через реле Узла 2.
                  </p>
                </div>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Локальная петля управления (Local Control Loop)</CardTitle>
                  <CardDescription className="text-xs">
                    Все операции выполняются в локальной сети — без внешних API или облачных баз данных
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-stretch gap-3 flex-wrap">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 min-w-[175px]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-100"><Cpu className="h-4 w-4 text-blue-700" /></div>
                        <div>
                          <p className="text-xs font-bold text-blue-900">Узел 1</p>
                          <p className="text-[11px] text-blue-600 font-mono">ESP32</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {["PM2.5 (GP2Y1014AU)","CO₂/TVOC (SGP30)","Темп./Влажность (DHT22)","Освещённость (TCS34725)","Ток (ACS712)"].map(s => (
                          <div key={s} className="flex items-center gap-1 text-[10px] text-blue-700">
                            <div className="h-1 w-1 rounded-full bg-blue-400 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">JSON пакет</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono whitespace-nowrap">60 сек / цикл</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 min-w-[175px]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-slate-100"><LayoutDashboard className="h-4 w-4 text-slate-700" /></div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">UniStat</p>
                          <p className="text-[11px] text-slate-600 font-mono">Web UI</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {["Оценка матрицы порогов","Предиктивная модель фильтра","Ручное управление реле","Журналирование событий","Визуализация трендов"].map(s => (
                          <div key={s} className="flex items-center gap-1 text-[10px] text-slate-700">
                            <div className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">команды реле</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono whitespace-nowrap">HTTP / локальная сеть</span>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 min-w-[175px]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-orange-100"><Zap className="h-4 w-4 text-orange-700" /></div>
                        <div>
                          <p className="text-xs font-bold text-orange-900">Узел 2</p>
                          <p className="text-[11px] text-orange-600 font-mono">Wemos D1 Mini</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {["Реле 1: Вентиляция воздуха","Реле 2–5: Группы освещения","Реле 6: Умные розетки","Матрица лимитов безопасности","ACS712: измерение тока"].map(s => (
                          <div key={s} className="flex items-center gap-1 text-[10px] text-orange-700">
                            <div className="h-1 w-1 rounded-full bg-orange-400 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-2xl">
                    ESP32 непрерывно считывает физические датчики и формирует структурированные JSON-пакеты.
                    UniStat анализирует их, применяет матрицу пороговых значений и предиктивные алгоритмы,
                    после чего отправляет команды на Wemos D1 Mini. Wemos оценивает матрицу лимитов
                    и переключает физические реле. Вся цепочка работает в пределах локальной сети.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Матрица пороговых значений безопасности</CardTitle>
                  <CardDescription className="text-xs">Условия автоматического срабатывания реле по данным Узла 1</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Параметр</th>
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Датчик</th>
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">WARN</th>
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">CRIT</th>
                          <th className="text-left py-2 text-muted-foreground font-medium">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[
                          { p: "PM2.5",    s: "GP2Y1014AU", w: ">25 мкг/м³", c: ">55 мкг/м³", a: "Активировать вентиляцию (Реле 1)" },
                          { p: "CO₂/TVOC", s: "SGP30",      w: ">800 ppm",   c: ">1500 ppm",  a: "Активировать вентиляцию (Реле 1)" },
                          { p: "Освещ.",   s: "TCS34725",   w: "<200 лк",    c: "<50 лк",     a: "Активировать группы света (Реле 2–5)" },
                          { p: "Темп.",    s: "DHT22",      w: ">23°C",      c: ">26°C",      a: "Уведомление оператора" },
                          { p: "Влажность",s: "DHT22",      w: "<35%",       c: "<25%",       a: "Уведомление оператора" },
                          { p: "Нагрузка", s: "ACS712",     w: ">10 кВт·ч",  c: ">15 кВт·ч",  a: "Отключить нагрузки (Реле 6)" },
                        ].map(row => (
                          <tr key={row.p}>
                            <td className="py-2 pr-4 font-medium">{row.p}</td>
                            <td className="py-2 pr-4 font-mono text-muted-foreground">{row.s}</td>
                            <td className="py-2 pr-4 text-amber-600">{row.w}</td>
                            <td className="py-2 pr-4 text-red-600">{row.c}</td>
                            <td className="py-2 text-muted-foreground">{row.a}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Этапы реализации проекта</CardTitle>
                  <CardDescription className="text-xs">КГТУ им. И. Раззакова · 2025–2026</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { n: 1, title: "Разработка схемотехники и калибровка сенсорного узла", desc: "Выбор и стендовая калибровка датчиков GP2Y1014AU, SGP30, DHT22, TCS34725. Верификация точности показаний по эталонным приборам. Прототипирование печатной платы для узла-сборщика на базе ESP32." },
                      { n: 2, title: "Проектирование и сборка схем исполнительных реле", desc: "Разработка схемы релейного модуля для Wemos D1 Mini. Интеграция датчиков тока ACS712 на линиях 220В. Сборка и нагрузочное тестирование всех 6 каналов реле." },
                      { n: 3, title: "Разработка прошивки микроконтроллеров (C++ / Arduino)", desc: "Прошивка ESP32: опрос датчиков, формирование JSON-пакета, цикл передачи 60 секунд. Прошивка Wemos D1 Mini: разбор команд, переключение реле, логика блокировки по безопасности." },
                      { n: 4, title: "Настройка локальных коммуникаций и архитектуры хранения", desc: "Конфигурирование локальной Wi-Fi сети. HTTP-канал команд между UniStat и Узлом 2. Архитектура журнала событий на основе кольцевого буфера в памяти." },
                      { n: 5, title: "Интеграция облачных сервисов и реализация серверной логики", desc: "Интеграция Firestore для персистентного хранения архива телеметрии (classroom_history). Серверный модуль оценки пороговых значений. API-эндпоинты для получения исторических данных." },
                      { n: 6, title: "Разработка и развёртывание фронтенд-панели управления", desc: "Дашборд на React / Next.js: телеметрия из архива Firestore, управление реле, предиктивная модель фильтра, аналитические графики, экспорт PDF-отчётов. Развёртывание и конфигурирование для презентации." },
                    ].map(step => (
                      <div key={step.n} className="flex items-start gap-4">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-background text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                          {step.n}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold">{step.title}</div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ВКЛАДКА 4 — КОМАНДА
          ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "team" && (
            <>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Команда проекта</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  UniStat — Система мониторинга и управления микроклиматом аудитории
                </p>
              </div>

              <Card>
                <CardContent className="pt-5 pb-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Учебное заведение", value: "КГТУ им. И. Раззакова" },
                      { label: "Факультет",         value: "Факультет компьютерных технологий и управления" },
                      { label: "Кафедра",           value: "Компьютерная инженерия" },
                      { label: "Учебный год",       value: "3-й курс · 2025–2026" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</div>
                        <div className="text-sm font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Команда разработчиков
                  </CardTitle>
                  <CardDescription className="text-xs">Участники проекта UniStat</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {["Islam Arzymatov","Barpybekov Bektur","Schailobekov Nursultan","Zhumaev Talant"].map(name => (
                      <div key={name}
                        className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-4 py-3.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground shrink-0">
                          <span className="text-xs font-bold text-background">
                            {name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{name}</div>
                          <div className="text-[11px] text-muted-foreground">КГТУ · 3-й курс</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    О проекте UniStat
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    UniStat — автономная платформа мониторинга микроклимата и управления инженерными системами
                    учебной аудитории. Аппаратная база — двухузловая IoT-сеть (ESP32 + Wemos D1 Mini),
                    работающая без внешних облачных зависимостей. Система отслеживает 5 физических параметров
                    среды в реальном времени, применяет предиктивные алгоритмы управления HEPA-фильтрацией
                    и обеспечивает детальную аналитику для институциональной отчётности и контроля качества.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </main>
    </div>
  )
}
