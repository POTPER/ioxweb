import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { registerOnRestore } from '@odoprd/capture-sdk'

type RestoreHandler = (state: Record<string, unknown>) => void

export function useOdoPrdBridge(
  snapshot: Record<string, unknown>,
  onRestore: RestoreHandler,
): void {
  useEffect(() => registerOnRestore(onRestore), [onRestore])

  useEffect(() => {
    window.__ODO_PRD__?.setState?.(snapshot)
  }, [snapshot])
}

export function OdoPrdRoot({
  snapshot,
  children,
  className,
  style,
}: {
  snapshot: Record<string, unknown>
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const attr = useMemo(() => JSON.stringify(snapshot), [snapshot])
  return (
    <div data-odo-prd-state={attr} className={className} style={style}>
      {children}
    </div>
  )
}
