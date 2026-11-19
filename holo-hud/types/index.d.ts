export type LogEntry = { id: string; at: string; tool: string; label: string; state: 'run' | 'ok' | 'fail' }
export type Wall = { at: number; turns: number; actions: number; alerts: number; files: string[]; log: LogEntry[] }
export type Geo = { city: string; country: string; lat: number; lon: number }
export type Stats = { turns: number; actions: number; alerts: number; files: string[] }

declare module 'claude-code' {
  interface PluginState {
    'holo-hud': {
      look: string
      busy: boolean
      alert: boolean
      isQuiet: boolean
      startedAt: number
      now: number
      minute: number
      log: Shaped<LogEntry[]>
      stats: Shaped<Stats>
      wall: Shaped<Wall>
      geo: Geo | null
    }
  }
}
