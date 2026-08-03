"use client"

import Link from "next/link"
import { Cpu, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

export function Header() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-base font-bold leading-tight tracking-wide">UniStat</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Панель управления · КГ Аудитория</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`gap-1.5 text-xs font-mono transition-colors ${
              connected
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-muted text-muted-foreground"
            }`}
          >
            <Wifi className="h-3 w-3" />
            {connected ? "Firestore: подключён" : "Подключение..."}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            LIVE
          </div>
        </div>
      </div>
    </header>
  )
}
