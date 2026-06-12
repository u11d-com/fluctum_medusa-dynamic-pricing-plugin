"use client"

import { useState, useEffect } from "react"
import { Button, StatusNotice, Text } from "@modules/common/components/ui"

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
  const hasExpired = Boolean(expiresAt) && remaining <= 0

  return (
    <StatusNotice tone={hasExpired ? "warning" : "info"} className="mb-6">
      {error && (
        <Text variant="error" className="text-xs mb-2">{error}</Text>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          {isRefreshing ? (
            <span className="text-sm text-ui-fg-muted">Locking Prices…</span>
          ) : remaining > 0 ? (
            <span className="text-sm text-ui-fg-base">
              Prices locked for{" "}
              <span className="font-mono font-semibold text-ui-fg-base tabular-nums">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </span>
          ) : expiresAt ? (
            <span className="text-sm text-tag-orange-text font-medium">
              Prices expired
            </span>
          ) : (
            <span className="text-sm text-ui-fg-muted">Initializing…</span>
          )}
          <Button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="link"
            size="xs"
            className="text-xs"
          >
            {isRefreshing ? "Locking…" : "Refresh Prices"}
          </Button>
        </div>
        {expiresAt && (
          <span className="text-[10px] text-ui-fg-muted font-mono">
            {new Date(expiresAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </StatusNotice>
  )
}
