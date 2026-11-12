import { useEffect, useState } from 'react'
import { getResourceHistory, getResourceSample } from '../data/monitoring'
import type { ResourcePoint } from '../types/monitoring'

const MAX_POINTS = 24

export function useResourceHistory(tick: number) {
  const [history, setHistory] = useState<ResourcePoint[]>([])

  useEffect(() => {
    let cancelled = false

    if (tick === 0) {
      getResourceHistory()
        .then((points) => {
          if (!cancelled) setHistory(points)
        })
        .catch(() => {})
    } else {
      getResourceSample()
        .then((point) => {
          if (!cancelled) setHistory((prev) => [...prev, point].slice(-MAX_POINTS))
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [tick])

  return history
}