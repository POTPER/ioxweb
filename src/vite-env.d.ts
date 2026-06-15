/// <reference types="vite/client" />

interface OdoPrdBridge {
  setState?: (state: Record<string, unknown>) => void
  registerOnRestore?: (handler: (state: Record<string, unknown>) => void) => () => void
}

interface Window {
  __ODO_PRD__?: OdoPrdBridge
}
