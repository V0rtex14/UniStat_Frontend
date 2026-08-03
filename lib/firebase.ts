/**
 * lib/firebase.ts
 * Инициализация Firebase и экспорт экземпляра Firestore.
 *
 * Защита от повторной инициализации при hot-reload (Next.js dev server):
 * перед созданием нового приложения проверяем, не было ли оно уже создано.
 *
 * Структура документа Firestore (classroom/state):
 * {
 *   telemetry: {
 *     pm25:     number,   // GP2Y1014AU — мкг/м³
 *     co2:      number,   // SGP30 — ppm CO₂экв
 *     lux:      number,   // TCS34725 — лк
 *     temp:     number,   // DHT22 — °C
 *     humidity: number,   // DHT22 — %
 *     powerKw:  number,   // ACS712/PZEM-004T — кВт
 *   },
 *   relays: {
 *     ventilation: boolean,
 *     sockets:     boolean,
 *     lightGroups: number,  // 0–4
 *   },
 *   schedule: {
 *     off: string,   // "18:00"
 *     on:  string,   // "08:00"
 *   }
 * }
 */

import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey:            "AIzaSyC71ItafWzV0nh_u_SAVdUGTsYHAWJfa4U",
  authDomain:        "unistat.firebaseapp.com",
  projectId:         "unistat",
  storageBucket:     "unistat.firebasestorage.app",
  messagingSenderId: "194370007345",
  appId:             "1:194370007345:web:24d717e3df236d892dc010",
}

// Инициализируем только один раз — защита от дублирования при hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const db = getFirestore(app)

// Путь к единственному документу состояния системы
export const CLASSROOM_COLLECTION = "classroom"
export const CLASSROOM_DOC_ID     = "state"
