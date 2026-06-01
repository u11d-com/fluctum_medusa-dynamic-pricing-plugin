"use client"

import { useState, useEffect } from "react"

type Props = {
  expiresAt: string | null
  isRefreshing: boolean
  onRefresh: () => void
  error: string | null
}

export default function PriceLockCountdown({ expiresAt, isRefreshing, onRefresh, error }: Props) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!expiresAt) return

    const tick = () => {
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()))
    }

    tick()
    const id = setInterval(tick, 1000)

    return () => clearInterval(id)
  }, [expiresAt])

  const totalSec = Math.max(0, Math.ceil(remaining / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60

  return (
    <div className="border border-gray-100 rounded-lg p-4 mb-6 bg-gray-50/50">
      {error && (
        <div className="text-xs text-red-600 mb-2">{error}</div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          {isRefreshing ? (
            <span className="text-sm text-gray-500">Locking prices...</span>
          ) : remaining > 0 ? (
            <span className="text-sm text-gray-700">
              Prices locked for{" "}
              <span className="font-mono font-semibold text-gray-900 tabular-nums">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </span>
          ) : expiresAt ? (
            <span className="text-sm text-orange-600 font-medium">
              Prices expired
            </span>
          ) : (
            <span className="text-sm text-gray-400">Initializing...</span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs text-gray-600 underline hover:text-gray-900 disabled:opacity-50"
          >
            {isRefreshing ? "Locking..." : "Refresh prices"}
          </button>
        </div>
        {expiresAt && (
          <span className="text-[10px] text-gray-400 font-mono">
            {new Date(expiresAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}
