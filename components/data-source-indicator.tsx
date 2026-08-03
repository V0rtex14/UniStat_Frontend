"use client"

import { useDataSource } from "@/hooks/use-data-source"
import { Badge } from "@/components/ui/badge"
import { Wifi, HardDrive } from "lucide-react"

export function DataSourceIndicator() {
  const { status, isDetecting } = useDataSource()

  if (isDetecting) {
    return (
      <Badge variant="secondary" className="text-xs">
        Определение...
      </Badge>
    )
  }

  return (
    <Badge
      variant={status.mode === "api" ? "default" : "secondary"}
      className="text-xs gap-1"
    >
      {status.mode === "api" ? (
        <>
          <Wifi className="h-3 w-3" />
          ESP32 API
        </>
      ) : (
        <>
          <HardDrive className="h-3 w-3" />
          JSON данные
        </>
      )}
    </Badge>
  )
}
