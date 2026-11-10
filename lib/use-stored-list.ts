"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * A small list of strings kept in this browser's localStorage (favourites, recent searches).
 * Storage can be unavailable (private mode, blocked site data) — then it simply isn't remembered.
 */
export function useStoredList(key: string, max = 50) {
  const [list, setList] = useState<string[]>([])

  useEffect(() => {
    try {
      const v: unknown = JSON.parse(localStorage.getItem(key) ?? "[]")
      if (Array.isArray(v)) setList(v.filter((x): x is string => typeof x === "string").slice(0, max))
    } catch {
      /* storage unavailable */
    }
  }, [key, max])

  const update = useCallback(
    (fn: (prev: string[]) => string[]) => {
      setList((prev) => {
        const next = fn(prev).slice(0, max)
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* storage unavailable */
        }
        return next
      })
    },
    [key, max],
  )

  return [list, update] as const
}
