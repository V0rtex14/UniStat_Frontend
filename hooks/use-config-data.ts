"use client"

import { useState, useEffect } from "react"

interface UseConfigDataResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

export function useConfigData<T>(fetcher: () => Promise<T>): UseConfigDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setError(null)
        const result = await fetcher()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error }
}
