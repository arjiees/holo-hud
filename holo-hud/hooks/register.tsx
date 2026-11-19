import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs, Timer } from 'claude-code'

import type { Geo, LogEntry, Wall } from '../types'
import { makeColors } from './make-colors.js'

type Look = {
  colors: ThemeSetArgs['colors']; problems: string[]; scene: string; tint: readonly [number, number, number]; accent: string; hot: string
  title: string; hello: string; done: string; warn: string
}

// Holo: deep navy glass with holographic cyan.
const holo = makeColors({
  label: 'Holo HUD',
  only: 'dark',
  roles: { accent: '#22d3ee', danger: '#ff4d6d', success: '#34f5a4', warning: '#ffb547', pro: '#a78bfa' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#050b14',
        'surface-1': '#0a1522',
        'surface-2': '#0e1c2c',
        'surface-3': '#122334',
        'text-primary': '#e6fbff',
        'text-secondary': '#a9d8e6',
        'text-muted': '#7fb0c2',
      },
    },
  },
})

// Armor: warm gunmetal with gold accents and crimson plating.
const armor = makeColors({
  label: 'Armor HUD',
  only: 'dark',
  roles: { accent: '#f5b301', danger: '#ff3b3b', success: '#4ade80', warning: '#ff9f1c', pro: '#7dd3fc' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0d0707',
        'surface-1': '#170c0c',
        'surface-2': '#1e1010',
        'surface-3': '#241414',
        'text-primary': '#fff4e0',
        'text-secondary': '#e8cfa8',
        'text-muted': '#c4a682',
      },
    },
  },
})

// Arc: near-black steel with an icy white-blue reactor glow.
const arc = makeColors({
  label: 'Arc HUD',
  only: 'dark',
  roles: { accent: '#9be7ff', danger: '#ff5c7a', success: '#5cf2b0', warning: '#ffc857', pro: '#9d8cff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#06090d',
        'surface-1': '#0c1218',
        'surface-2': '#111921',
        'surface-3': '#16202a',
        'text-primary': '#f1faff',
        'text-secondary': '#c3d9e6',
        'text-muted': '#93adbd',
      },
    },
  },
})

// A control wall, recolored per look: panels pack the left and right edges so the chat in the middle stays clear.
const hud = (bg: string, ring: string, core: string, plate: string, gridPath: string, hot: string) => {
  const panel = (x: number, y: number, w: number, h: number, title: string) =>
    `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="4" fill="${ring}" fill-opacity=".3" stroke="${ring}" stroke-width="2"/>` +
    `<rect width="${w}" height="16" rx="2" fill="${ring}" fill-opacity=".6"/><text x="8" y="12" class="t">${title}</text></g>`
  const range = (n: number) => Array.from({ length: n }, (_, i) => i)

  const bars = range(8).map(i =>
    `<rect class="bar" style="animation-delay:calc(var(--t) * -1s - ${(i * 0.7).toFixed(1)}s)" x="${40 + i * 25}" y="760" width="14" height="100" fill="${i === 5 ? hot : ring}" fill-opacity=".55"/>`,
  ).join('')

  const shapes = [
    '0,-26 23,-13 23,13 0,26 -23,13 -23,-13',
    '0,-28 28,0 0,28 -28,0',
    '0,-26 24,18 -24,18',
    '-18,-18 18,-18 18,18 -18,18',
  ]
  const badges = range(4).map(i => {
    const cy = 110 + i * 150
    const edge = i === 2 ? hot : ring
    return `<g transform="translate(330 ${cy})"><circle r="56" fill="${ring}" fill-opacity=".05" stroke="${ring}" stroke-opacity=".3"/>` +
      `<g class="spin"><circle r="48" fill="none" stroke="${edge}" stroke-opacity=".7" stroke-width="3" stroke-dasharray="70 30 20 30"/></g>` +
      `<polygon points="${shapes[i]}" fill="${plate}" fill-opacity=".25" stroke="${core}" stroke-opacity=".8" stroke-width="1.5"/>` +
      `<text x="-22" y="76" class="t">MOD 0${i + 1}</text></g>`
  }).join('')

  const wave = (amp: number, freq: number, phase: number) => {
    const pts = range(201).map(i => `${i * 8},${(Math.sin(i * freq + phase) * amp + Math.sin(i * freq * 3.1) * amp * 0.3).toFixed(1)}`)
    return `<polyline class="wave" points="${pts.join(' ')}" fill="none" stroke="${ring}" stroke-opacity=".8" stroke-width="1.5"/>`
  }

  // No markup characters: a glyph is written straight into the SVG.
  const GLYPHS = '01アイウエオカキクケコサシスセソ7Z:=+*38'
  const rain = (id: string, size: number, tall: number) => {
    const step = size + 4
    const columns = range(8).map(c => range(14).map(i => {
      const y = ((c * 97) % tall + i * step) % tall
      return `<text x="${c * step * 1.6}" y="${y}" font-size="${size}" fill-opacity="${((i + 1) / 14).toFixed(2)}">${GLYPHS[(i * 7 + c * 13 + size) % GLYPHS.length]}</text>`
    }).join('')).join('')
    return `<pattern id="${id}" width="${8 * step * 1.6}" height="${tall}" patternUnits="userSpaceOnUse"><g font-family="monospace" fill="${ring}">${columns}</g></pattern>`
  }
  const fall = (id: string, tall: number, opacity: number) =>
    `<rect class="${id}" y="-${tall}" width="1600" height="${1000 + tall}" fill="url(#${id})" opacity="${opacity}"/>`

  const spokes = range(24).map(i => `<path d="M0 -168V-${i % 3 === 0 ? 205 : 188}" transform="rotate(${i * 15})"/>`).join('')
  const blocks = range(30).map(i => `<rect x="${430 + i * 24}" y="42" width="18" height="8" fill="${i % 7 === 3 ? hot : ring}" fill-opacity="${i < 19 ? 0.6 : 0.15}"/>`).join('')
  const reactor = `<g transform="translate(790 480)" fill="none" stroke="${ring}" stroke-width="2" style="opacity:1">
<circle r="330" fill="url(#glow)" stroke="none"/>
<g class="spin"><circle r="318" stroke-opacity=".7" stroke-dasharray="2 10"/></g>
<g class="rev"><circle r="285" stroke-opacity=".55" stroke-width="16" stroke-dasharray="210 40 70 40 20 40"/></g>
<g class="spin"><circle r="250" stroke="${core}" stroke-opacity=".8" stroke-width="3" stroke-dasharray="330 70"/></g>
<g class="rev"><circle r="222" stroke-opacity=".4" stroke-width="26" stroke-dasharray="6 12"/></g>
<g class="spin" stroke-opacity=".5" stroke-width="2">${spokes}</g>
<circle r="160" fill="${ring}" fill-opacity=".14" stroke-opacity=".9" stroke-width="2"/>
<g class="rev"><polygon points="0,-125 108,-62 108,62 0,125 -108,62 -108,-62" fill="${plate}" fill-opacity=".2" stroke="${core}" stroke-opacity=".9" stroke-width="2"/></g>
<g class="spin"><circle r="88" stroke="${hot}" stroke-opacity=".6" stroke-width="5" stroke-dasharray="90 48"/></g>
<circle r="60" fill="url(#glow)" stroke="none"/>
<circle class="pulse" r="26" fill="${core}" fill-opacity=".55" stroke="none"/>
</g>${blocks}`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
svg{--t:__T__}
.r1{animation:f1 14s linear infinite}.r2{animation:f2 21s linear infinite}.r3{animation:f3 9s linear infinite}
.spin,.rev,.globe,.wave,.blink,.r1,.r2,.r3{animation-delay:calc(var(--t) * -1s)}
.t{font:700 11px monospace;fill:#ffffff;letter-spacing:1px}
.n{font:700 12px monospace;fill:#ffffff}
.d{font:11px monospace;fill:#ffffff}
.big{font:300 30px monospace;fill:${ring};letter-spacing:2px}
.spin{transform-box:fill-box;transform-origin:center;animation:spin 40s linear infinite}
.rev{transform-box:fill-box;transform-origin:center;animation:spin 70s linear infinite reverse}
.globe{transform-box:fill-box;transform-origin:center;animation:turn 12s ease-in-out infinite alternate}
.bar{transform-box:fill-box;transform-origin:bottom;animation:bar 5.6s ease-in-out infinite}
.wave{animation:slide 8s linear infinite}
.blink{animation:blink 2s steps(2) infinite}
.pulse{animation:pulse 4s ease-in-out infinite;animation-delay:calc(var(--t) * -1s)}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes turn{from{transform:scaleX(.15)}to{transform:scaleX(1)}}
@keyframes bar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes slide{to{transform:translateX(-800px)}}
@keyframes f1{to{transform:translateY(440px)}}
@keyframes f2{to{transform:translateY(360px)}}
@keyframes f3{to{transform:translateY(520px)}}
@keyframes blink{50%{opacity:.2}}
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
</style>
<defs>
<pattern id="grid" width="48" height="42" patternUnits="userSpaceOnUse"><path d="${gridPath}" fill="none" stroke="${plate}" stroke-opacity=".12"/></pattern>
<radialGradient id="glow"><stop offset="0" stop-color="${core}" stop-opacity=".3"/><stop offset="1" stop-color="${core}" stop-opacity="0"/></radialGradient>
<radialGradient id="air" cx="50%" cy="47%" r="65%"><stop offset="0" stop-color="${ring}" stop-opacity=".4"/><stop offset=".6" stop-color="${ring}" stop-opacity=".14"/><stop offset="1" stop-color="${ring}" stop-opacity="0"/></radialGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".15" stop-color="#ffffff" stop-opacity="0"/><stop offset=".32" stop-color="#ffffff" stop-opacity=".16"/><stop offset=".45" stop-color="#ffffff" stop-opacity="0"/><stop offset=".7" stop-color="#ffffff" stop-opacity="0"/><stop offset=".82" stop-color="#ffffff" stop-opacity=".08"/><stop offset=".95" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
${rain('r1', 14, 440)}${rain('r2', 10, 360)}${rain('r3', 20, 520)}
<clipPath id="earth"><circle cx="1378" cy="205" r="100"/></clipPath>
<clipPath id="scope"><rect x="1190" y="618" width="380" height="150"/></clipPath>
</defs>
<rect width="1600" height="1000" fill="${bg}"/>
<rect width="1600" height="1000" fill="${ring}" fill-opacity=".14"/>
<rect width="1600" height="1000" fill="url(#air)"/>
<!-- matrix rain -->
${fall('r3', 520, 0.4)}${fall('r2', 360, 0.5)}${fall('r1', 440, 0.8)}
<rect width="1600" height="1000" fill="url(#grid)"/>
${reactor}
<!-- top bar -->
<rect x="20" y="10" width="1560" height="20" fill="${ring}" fill-opacity=".07" stroke="${ring}" stroke-opacity=".25"/>
<text x="32" y="24" class="t">SYS  NET  OPS  LOG  ARCHIVE</text>
<circle class="blink" cx="1420" cy="20" r="4" fill="${hot}"/>
<text x="1432" y="24" class="t">SESSION LIVE</text>
<!-- left wall -->
${panel(24, 50, 226, 190, 'FILES CHANGED')}__FILES__
${panel(24, 255, 226, 265, 'ACTIVITY')}__ACT__
${panel(24, 535, 226, 165, '__MONTH__')}__CAL__
${panel(24, 715, 226, 160, 'THROUGHPUT')}${bars}
${badges}
<!-- right wall: globe -->
${panel(1180, 50, 396, 300, 'LOCATION')}
<circle cx="1378" cy="205" r="125" fill="url(#glow)"/>
<g class="rev"><circle cx="1378" cy="205" r="122" fill="none" stroke="${ring}" stroke-opacity=".35" stroke-dasharray="3 8"/></g>
<circle cx="1378" cy="205" r="100" fill="${ring}" fill-opacity=".12" stroke="${ring}" stroke-width="2"/>
__GEO__
<!-- right wall: status list -->
${panel(1180, 365, 396, 220, 'TELEMETRY')}
__SUBS__
<!-- right wall: signal analyzer -->
${panel(1180, 600, 396, 180, 'SIGNAL ANALYZER')}
<g clip-path="url(#scope)">
<g transform="translate(1190 650)">${wave(14, 0.18, 0)}</g>
<g transform="translate(1190 700)">${wave(9, 0.31, 1)}</g>
<g transform="translate(1190 745)">${wave(6, 0.52, 2)}</g>
</g>
<!-- right wall: clock -->
<rect x="1180" y="795" width="396" height="70" rx="4" fill="${ring}" fill-opacity=".04" stroke="${ring}" stroke-opacity=".35"/>
<text x="1318" y="842" class="big">__HH__<tspan class="blink">:</tspan>__MM__</text>
<rect width="1600" height="1000" fill="url(#sheen)"/>
<!-- corner brackets -->
<g fill="none" stroke="${ring}" stroke-opacity=".35" stroke-width="2">
<path d="M10 70V40"/><path d="M1590 70V40"/><path d="M10 930V970H50"/><path d="M1590 930V970H1550"/>
</g>
</svg>`
}

const SQUARE = 'M48 0H0V42'
const HEX = 'M12 0H36L48 21L36 42H12L0 21Z'

const LOOKS: Record<string, Look> = {
  arc: {
    ...arc, colors: arc.theme, tint: [0.62, 0.9, 1], accent: '#9be7ff', hot: '#7c9cff', title: 'CORE STATUS',
    scene: hud('#06090d', '#9be7ff', '#ffffff', '#5b8cff', SQUARE, '#7c9cff'),
    hello: 'Arc core online.', done: 'Task complete.', warn: 'Warning. Core fluctuation.',
  },
  holo: {
    ...holo, colors: holo.theme, tint: [0.13, 0.83, 0.93], accent: '#22d3ee', hot: '#ff9f1c', title: 'SYSTEM STATUS',
    scene: hud('#050b14', '#22d3ee', '#22d3ee', '#22d3ee', SQUARE, '#ff9f1c'),
    hello: 'All systems online.', done: 'Task complete.', warn: 'Warning. An action failed.',
  },
  armor: {
    ...armor, colors: armor.theme, tint: [0.96, 0.7, 0], accent: '#f5b301', hot: '#ff3b3b', title: 'SUIT STATUS',
    scene: hud('#0d0707', '#f5b301', '#e8f6ff', '#ff3b3b', HEX, '#ff3b3b'),
    hello: 'Suit online. Power at 100 percent.', done: 'Task complete.', warn: 'Warning. Damage detected.',
  },
}
const NAMES = Object.keys(LOOKS).join(' | ')
const PANE = 'hud'
const LOG_ROWS = 6
// Voice lines only for turns long enough that you may have looked away.
const SPEAK_AFTER_MS = 20_000

const look = atom({ plugin: 'holo-hud', key: 'look' } as const, 'arc')
const busy = atom({ plugin: 'holo-hud', key: 'busy' } as const, false)
const alert = atom({ plugin: 'holo-hud', key: 'alert' } as const, false)
const isQuiet = atom({ plugin: 'holo-hud', key: 'isQuiet' } as const, false)
const isMono = atom({ plugin: 'holo-hud', key: 'isMono' } as const, true)
const startedAt = atom({ plugin: 'holo-hud', key: 'startedAt' } as const, 0)
const now = atom({ plugin: 'holo-hud', key: 'now' } as const, 0)
const minute = atom({ plugin: 'holo-hud', key: 'minute' } as const, 0)
const log = atom({ plugin: 'holo-hud', key: 'log' } as const, [], { shape: 'log-1' })
const stats = atom({ plugin: 'holo-hud', key: 'stats' } as const, { turns: 0, actions: 0, alerts: 0, files: [] }, { shape: 'stats-1' })

// What the wall shows: a snapshot, so the backdrop redraws once a turn or minute, not on every tool call.
const wall = atom({ plugin: 'holo-hud', key: 'wall' } as const, { at: 0, turns: 0, actions: 0, alerts: 0, files: [], log: [] }, { shape: 'wall-1' })
const geo = atom({ plugin: 'holo-hud', key: 'geo' } as const, null)

const lookOf = (name: string): Look => LOOKS[name] ?? LOOKS.arc!

async function applyLook($: EngineInterface, name: string) {
  const chosen = lookOf(name)
  const unpainted = chosen.problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    $.ui.toast(unpainted)
  }
  await update($, look, () => name)
  // A host without themes still gets the panel, sounds and commands; the answer is reported, never swallowed.
  return $.theme
    .set({ colors: chosen.colors, backdrop: { scene: name, glass: { blur: 2, tint: '#020812', opacity: 0.58 } } })
    .then(
      set => ($.ui.status(set.isDrawn ? undefined : set.reason), set.isDrawn ? `Theme set, backdrop drawn (request ${set.requestId}).` : `Theme set, but not drawn: ${set.reason}`),
      (err: unknown) => `Theme refused: ${err instanceof Error ? err.message : String(err)}`,
    )
    .then(report => `${report}${unpainted === undefined ? '' : ` Colors: ${unpainted}`}`)
}

async function cue($: EngineInterface, sound: 'online' | 'done' | 'alert', line?: string) {
  if (await read($, isQuiet)) {
    return
  }
  // A missing player or a busy speaker must never break a turn.
  void $.audio.play({ asset: `sounds/${sound}.wav` }).catch(() => undefined)

  if (line !== undefined) {
    void $.audio.speak(line).catch(() => undefined)
  }
}

async function snapshot($: EngineInterface) {
  const s = await read($, stats)
  const list = await read($, log)
  const at = await $.clock.now()
  await update($, wall, (): Wall => ({ at, turns: s.turns, actions: s.actions, alerts: s.alerts, files: s.files.slice(-9), log: list.slice(-12) }))
}

// The person chose this: one request to an outside service, which sees the internet address it comes from.
let locationNote = 'Location: still looking up.'

async function locate($: EngineInterface) {
  const res = await $.http.fetch('https://ipwho.is/')
  const d: unknown = res.ok ? JSON.parse(res.text) : null

  if (typeof d !== 'object' || d === null) {
    locationNote = `Location lookup failed: the service answered ${res.status}.`

    return
  }
  const { success, city, country, latitude, longitude } = d as Record<string, unknown>
  const isPlace = success === true && typeof latitude === 'number' && typeof longitude === 'number' &&
    Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180

  if (!isPlace) {
    locationNote = 'Location lookup failed: the reply held no usable place.'

    return
  }
  const place: Geo = { city: String(city ?? '').slice(0, 24), country: String(country ?? '').slice(0, 24), lat: latitude, lon: longitude }
  await update($, geo, () => place)
  await snapshot($)
  locationNote = `Location: ${place.city || 'found'}.`
}

// Text from tools, files and the lookup goes into SVG markup: no markup or control characters survive.
const esc = (text: string, max: number) =>
  text.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Low-poly continents as [longitude, latitude] corners: hand-drawn and rough, since a scene embeds no map image.
const LAND: [number, number][][] = [
  [[-168, 66], [-156, 71], [-141, 70], [-128, 70], [-110, 68], [-95, 72], [-82, 70], [-78, 62], [-64, 60], [-56, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 29], [-97, 26], [-97, 19], [-91, 18], [-87, 21], [-87, 16], [-83, 10], [-78, 8], [-80, 7], [-85, 10], [-92, 15], [-105, 20], [-110, 23], [-115, 30], [-117, 33], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 55], [-160, 59], [-166, 62]],
  [[-55, 60], [-44, 60], [-22, 70], [-20, 80], [-35, 84], [-60, 82], [-70, 77], [-55, 70]],
  [[-78, 8], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -15], [-48, -26], [-57, -37], [-65, -42], [-68, -53], [-74, -52], [-73, -40], [-70, -18], [-76, -13], [-81, -5], [-80, 1]],
  [[-17, 15], [-16, 22], [-10, 29], [-6, 36], [10, 37], [11, 33], [25, 32], [33, 31], [37, 22], [43, 12], [51, 11], [42, -2], [40, -15], [35, -24], [28, -33], [20, -35], [17, -29], [12, -17], [13, -5], [9, 3], [-5, 5], [-13, 9]],
  [[-9, 37], [-9, 43], [-1, 44], [-4, 48], [3, 51], [8, 54], [8, 57], [5, 60], [12, 65], [25, 71], [40, 67], [60, 69], [70, 73], [90, 76], [105, 78], [130, 72], [160, 70], [178, 68], [178, 63], [163, 60], [156, 52], [143, 59], [135, 54], [141, 48], [130, 42], [127, 35], [122, 39], [121, 31], [118, 24], [109, 21], [106, 10], [100, 13], [99, 8], [104, 1], [98, 8], [94, 16], [90, 22], [80, 15], [77, 8], [73, 17], [67, 25], [57, 25], [51, 28], [48, 30], [51, 25], [56, 26], [59, 22], [52, 16], [44, 12], [43, 15], [35, 28], [36, 36], [27, 37], [26, 40], [23, 40], [22, 37], [19, 42], [13, 45], [18, 40], [16, 38], [12, 44], [8, 44], [3, 43], [0, 39], [-5, 36]],
  [[114, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -27], [150, -37], [144, -38], [135, -35], [125, -33], [115, -34]],
  [[-5, 50], [1, 51], [-2, 56], [-5, 58], [-6, 55]],
  [[130, 32], [136, 35], [141, 38], [142, 44], [140, 41], [135, 34]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[109, 1], [117, 6], [119, 0], [114, -4]],
  [[95, 5], [104, -5], [106, -6], [98, 2]],
  [[173, -41], [178, -38], [175, -36], [170, -45], [167, -46]],
]

// The Earth turned to face a place: an orthographic view, so the far side is hidden behind the rim.
function earthMarkup(chosen: Look, place: Geo | null): string {
  const rad = Math.PI / 180
  const lon0 = (place?.lon ?? -30) * rad
  // Half the latitude: the place sits above the middle and the globe still reads as upright.
  const lat0 = ((place?.lat ?? 30) / 2) * rad
  const project = (lon: number, lat: number) => {
    const l = lon * rad - lon0
    const f = lat * rad
    const isNear = Math.sin(lat0) * Math.sin(f) + Math.cos(lat0) * Math.cos(f) * Math.cos(l) >= 0
    let x = Math.cos(f) * Math.sin(l)
    let y = Math.cos(lat0) * Math.sin(f) - Math.sin(lat0) * Math.cos(f) * Math.cos(l)

    if (!isNear) {
      // shortcut: a far-side corner is pushed to the rim instead of clipped exactly, redo with real clipping if coasts near the rim look wrong
      const n = Math.hypot(x, y) || 1
      x /= n
      y /= n
    }

    return { x: (1378 + 100 * x).toFixed(1), y: (205 - 100 * y).toFixed(1), isNear }
  }
  const land = LAND.map(shape => {
    const points: string[] = []
    let isSeen = false

    shape.forEach(([lon, lat], i) => {
      const [lon2, lat2] = shape[(i + 1) % shape.length]!
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(lon2 - lon), Math.abs(lat2 - lat)) / 6))

      for (let k = 0; k < steps; k++) {
        const p = project(lon + ((lon2 - lon) * k) / steps, lat + ((lat2 - lat) * k) / steps)
        isSeen ||= p.isNear
        points.push(`${p.x},${p.y}`)
      }
    })

    return isSeen ? `<polygon points="${points.join(' ')}"/>` : ''
  }).join('')
  const line = (at: (i: number) => [number, number]) => {
    let d = ''
    let isDown = false

    for (let i = 0; i <= 36; i++) {
      const p = project(...at(i))
      d += p.isNear ? `${isDown ? 'L' : 'M'}${p.x} ${p.y}` : ''
      isDown = p.isNear
    }

    return d
  }
  const grid = [-60, -30, 0, 30, 60].map(lat => line(i => [-180 + i * 10, lat])).join('') +
    Array.from({ length: 12 }, (_, m) => line(i => [m * 30 - 180, -90 + i * 5])).join('')
  const here = place === null ? null : project(place.lon, place.lat)
  const marker = here === null ? '' :
    `<circle class="pulse" cx="${here.x}" cy="${here.y}" r="13" fill="none" stroke="${chosen.hot}" stroke-width="2"/>` +
    `<circle cx="${here.x}" cy="${here.y}" r="5" fill="${chosen.hot}" stroke="#ffffff" stroke-width="1.5"/>`

  return `<g clip-path="url(#earth)"><path d="${grid}" fill="none" stroke="${chosen.accent}" stroke-opacity=".35"/>` +
    `<g fill="${chosen.accent}" fill-opacity=".6" stroke="#ffffff" stroke-opacity=".8" stroke-linejoin="round">${land}</g></g>${marker}`
}

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

function wallMarkup(chosen: Look, name: string, w: Wall, place: Geo | null, quiet: boolean, uptimeMs: number, at: Date): Record<string, string> {
  const ring = chosen.accent
  const files = w.files.length === 0
    ? `<text x="36" y="84" class="d" fill-opacity=".7">NO FILES CHANGED YET</text>`
    : w.files.map((file, i) => `<text x="36" y="${84 + i * 17}" class="d">▸ ${esc(file.split('/').pop() ?? file, 27)}</text>`).join('')
  const mark = { run: '›', ok: '✓', fail: '✗' } as const
  const activity = w.log.length === 0
    ? `<text x="36" y="290" class="d" fill-opacity=".7">NO ACTIVITY YET</text>`
    : w.log.map((one, i) =>
      `<text x="36" y="${290 + i * 19}" class="d"${one.state === 'fail' ? ` style="fill:${chosen.hot}"` : ''}>${one.at.slice(0, 5)} ${mark[one.state]} ${esc(`${one.tool} ${one.label}`, 22)}</text>`).join('')

  const first = new Date(at.getFullYear(), at.getMonth(), 1).getDay()
  const days = new Date(at.getFullYear(), at.getMonth() + 1, 0).getDate()
  const cell = (slot: number) => ({ x: 38 + (slot % 7) * 30, y: 588 + Math.floor(slot / 7) * 19 })
  const calendar = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => `<text x="${38 + i * 30}" y="568" class="d" fill-opacity=".7">${d}</text>`).join('') +
    Array.from({ length: days }, (_, i) => {
      const { x, y } = cell(first + i)
      const today = i + 1 === at.getDate() ? `<rect x="${x - 5}" y="${y - 13}" width="26" height="17" rx="3" fill="${chosen.hot}"/>` : ''
      return `${today}<text x="${x}" y="${y}" class="n">${i + 1}</text>`
    }).join('')

  const rows: [string, string, boolean][] = [
    ['TURNS', String(w.turns), false],
    ['ACTIONS', String(w.actions), false],
    ['ALERTS', String(w.alerts), w.alerts > 0],
    ['FILES CHANGED', String(w.files.length), false],
    ['UPTIME', elapsed(uptimeMs).slice(0, 5), false],
    ['LOOK', name.toUpperCase(), false],
    ['SOUND', quiet ? 'OFF' : 'ON', false],
    ['LOCATION', place === null ? 'UNKNOWN' : esc(place.city.toUpperCase() || 'FOUND', 20), false],
  ]
  const subs = rows.map(([label, value, isHot], i) =>
    `<text x="1196" y="${400 + i * 23}" class="d">${label}</text>` +
    `<text x="1560" y="${400 + i * 23}" class="n" text-anchor="end"${isHot ? ` style="fill:${chosen.hot}"` : ''}>${value}</text>` +
    `<path d="M1196 ${406 + i * 23}H1560" stroke="${ring}" stroke-opacity=".35"/>`).join('')

  const where = earthMarkup(chosen, place) + `<text x="1196" y="336" class="t">${place === null
    ? 'LOCATION UNKNOWN'
    : `${esc(`${place.city}, ${place.country}`.toUpperCase(), 30)}  ${Math.abs(place.lat).toFixed(1)}${place.lat < 0 ? 'S' : 'N'} ${Math.abs(place.lon).toFixed(1)}${place.lon < 0 ? 'W' : 'E'}`}</text>`

  return { __FILES__: files, __ACT__: activity, __MONTH__: `${MONTHS[at.getMonth()]} ${at.getFullYear()}`, __CAL__: calendar, __SUBS__: subs, __GEO__: where }
}

function labelOf(e: object): string {
  const args = e as Record<string, unknown>
  const text = [args.command, args.file_path, args.pattern, args.url, args.description].find(x => typeof x === 'string')

  return typeof text === 'string' ? text.split('/').slice(-2).join('/').slice(0, 60) : ''
}

// A bar that steps along once a second while Claude works.
const gauge = (ms: number) => {
  const at = Math.floor(ms / 1000) % 10
  return Array.from({ length: 10 }, (_, i) => (i <= at ? '▰' : '▱')).join('')
}

const clockText = (ms: number) => new Date(ms).toTimeString().slice(0, 8)

function elapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

export const register: Register = on => {
  let turnStart = 0
  let warned = false
  let clearAlert: Timer | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'hud', description: `HUD: /hud ${NAMES} | panel | quiet | font` })
    const t = await $.clock.now()

    if ((await read($, startedAt)) === 0) {
      await update($, startedAt, () => t)
    }
    const tick = async (ms: number) => {
      await update($, now, () => ms)
      // The backdrop reads only the minute, so it redraws once a minute, not every second.
      const m = Math.floor(ms / 60_000)

      if ((await read($, minute)) !== m) {
        await update($, minute, () => m)
        await snapshot($)
      }
    }
    await tick(t)
    $.clock.every(1000, () => void $.clock.now().then(tick))
    await snapshot($)
    void locate($).catch((err: unknown) => {
      locationNote = `Location lookup failed: ${err instanceof Error ? err.message : String(err)}`
    })

    const mono = (await $.store.get('mono')) !== false
    await update($, isMono, () => mono)
    const stored = await $.store.get('quiet')
    await update($, isQuiet, () => stored === true)
    const name = String((await $.store.get('look')) ?? 'arc')
    await applyLook($, name)

    if (e.surface === 'desktop') {
      void $.ui.open({ id: PANE, title: lookOf(name).title })
    }
    $.ui.toast(lookOf(name).hello)
    void cue($, 'online')

    return next(e)
  })

  on('command.run', { command: 'hud' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()

    if (arg === 'panel') {
      await $.ui.open({ id: PANE, title: lookOf(await read($, look)).title })

      return { text: 'HUD panel opened.' }
    }

    if (arg === 'quiet') {
      const quiet = !(await read($, isQuiet))
      await update($, isQuiet, () => quiet)
      await $.store.set('quiet', quiet)

      return { text: quiet ? 'HUD sounds off.' : 'HUD sounds on.' }
    }

    if (arg === 'font') {
      const mono = !(await read($, isMono))
      await update($, isMono, () => mono)
      await $.store.set('mono', mono)

      return { text: mono ? 'Chat uses the panel font. Formatting shows as plain symbols.' : 'Chat is back to the normal font and formatting.' }
    }

    if (!(arg in LOOKS)) {
      return { text: `Try: /hud ${NAMES} | panel | quiet | font` }
    }
    await $.store.set('look', arg)
    const report = await applyLook($, arg)
    $.ui.toast(lookOf(arg).hello)
    void cue($, 'online')

    return { text: `HUD switched to ${arg}. ${report} ${locationNote}` }
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      turnStart = await $.clock.now()
      warned = false
      await update($, busy, () => true)
      await update($, stats, s => ({ ...s, turns: s.turns + 1 }))
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, busy, () => false)
      await snapshot($).catch(() => undefined)

      if (!e.isAborted) {
        const isLong = (await $.clock.now()) - turnStart > SPEAK_AFTER_MS
        void cue($, 'done', isLong ? lookOf(await read($, look)).done : undefined)
      }
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id
    const file = (e as Record<string, unknown>).file_path
    const isWrite = (e.tool === 'Edit' || e.tool === 'Write') && typeof file === 'string'

    // The HUD only watches: a failure in its bookkeeping must never block the tool.
    const begin = async () => {
      const entry: LogEntry = { id, at: clockText(await $.clock.now()), tool: e.tool, label: labelOf(e), state: 'run' }
      await update($, log, list => [...list, entry].slice(-100))
    }
    const finish = async (failed: boolean) => {
      await update($, log, list => list.map((one): LogEntry => (one.id === id ? { ...one, state: failed ? 'fail' : 'ok' } : one)))
      const touched = isWrite && !failed ? String(file) : undefined
      await update($, stats, s => ({
        ...s,
        actions: s.actions + 1,
        alerts: s.alerts + (failed ? 1 : 0),
        files: touched === undefined || s.files.includes(touched) ? s.files : [...s.files, touched].slice(-200),
      }))

      if (failed) {
        await update($, alert, () => true)
        clearAlert?.cancel()
        clearAlert = $.clock.after(3500, () => void update($, alert, () => false))
        $.ui.toast(`Warning: ${e.tool} failed`)
        void cue($, 'alert', warned ? undefined : lookOf(await read($, look)).warn)
        warned = true
      }
    }

    await begin().catch(() => undefined)
    const ran = await next(e)
    await finish('isError' in ran && ran.isError === true).catch(() => undefined)

    return ran
  })

  // The app has no font setting and Markdown takes no face, so the panel font costs a reply its formatting: /hud font undoes it.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !(await read($, isMono))) {
      return next(e)
    }
    const { Text } = $.ui.resolve(e)

    return <Text mono>{e.props.text}</Text>
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const isPrompt = e.props.task === undefined && e.props.from === undefined

    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !isPrompt || !(await read($, isMono))) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box alignSelf="flex-end" borderStyle="round" paddingX={1}>
        <Text mono>{e.props.text}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    const chosen = LOOKS[e.props.scene]

    if (chosen === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Shader, Svg } = $.ui.resolve(e)
    const [r, g, b] = chosen.tint
    const fx = { busy: (await read($, busy)) ? 1 : 0, alert: (await read($, alert)) ? 1 : 0, r, g, b }
    const w = await read($, wall)
    // The later of the minute and the snapshot: animations keep their phase across a redraw.
    const ms = Math.max((await read($, minute)) * 60_000, w.at)
    const at = new Date(ms)
    const pad = (n: number) => String(n).padStart(2, '0')
    const live: Record<string, string> = {
      ...wallMarkup(chosen, e.props.scene, w, await read($, geo), await read($, isQuiet), ms - (await read($, startedAt)), at),
      __HH__: pad(at.getHours()),
      __MM__: pad(at.getMinutes()),
      __T__: String(Math.floor(ms / 1000) % 25_200),
    }
    const scene = chosen.scene.replace(/__[A-Z]+__/g, key => live[key] ?? '')

    return (
      <Shader module="./fx.ts" values={fx}>
        <Svg source={scene} alt="A control wall of panels and a turning reactor dial over falling matrix code" />
      </Shader>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const name = await read($, look)
    const chosen = lookOf(name)
    const s = await read($, stats)
    const list = await read($, log)
    const isBusy = await read($, busy)
    const isAlert = await read($, alert)
    const quiet = await read($, isQuiet)
    const mission = elapsed((await read($, now)) - (await read($, startedAt)))
    const mark = { run: '›', ok: '✓', fail: '✗' } as const
    const frame = (title: string, body: JSX.Element) => (
      <Box flexDirection="column" borderStyle="round" borderColor={chosen.accent} paddingX={1}>
        <Text color={chosen.accent} bold mono>{title}</Text>
        {body}
      </Box>
    )
    const switchTo = async (next: string) => {
      await $.store.set('look', next)
      await applyLook($, next)
      void cue($, 'online')
    }
    const toggleQuiet = async () => {
      await update($, isQuiet, q => !q)
      await $.store.set('quiet', await read($, isQuiet))
    }

    return (
      <Box flexDirection="column" gap={1}>
        {frame(chosen.title, (
          <Box flexDirection="column">
            <Text mono tabular>MISSION  {mission}</Text>
            <Text mono color={isAlert ? '#ff4d6d' : isBusy ? chosen.accent : undefined}>
              CORE     {isAlert ? '▲ ALERT' : isBusy ? '● ACTIVE' : '○ STANDBY'}
            </Text>
            <Text mono color={chosen.accent}>
              {isBusy ? `LOAD     ${gauge(await read($, now))}` : 'POWER    ██████████ 100%'}
            </Text>
          </Box>
        ))}
        {frame('TELEMETRY', (
          <Box flexDirection="column">
            <Text mono tabular>TURNS {s.turns}   ACTIONS {s.actions}</Text>
            <Text mono tabular>ALERTS {s.alerts}   FILES {s.files.length}</Text>
          </Box>
        ))}
        {frame('ACTIVITY', (
          <Box flexDirection="column">
            {list.length === 0 && <Text dimColor>No activity yet.</Text>}
            {list.slice(-LOG_ROWS).reverse().map(one => (
              <Text mono wrap="truncate-end" dimColor={one.state === 'ok'} color={one.state === 'fail' ? '#ff4d6d' : undefined}>
                {one.at} {mark[one.state]} {one.tool} {one.label}
              </Text>
            ))}
          </Box>
        ))}
        {frame('CONTROLS', (
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {Object.keys(LOOKS).map(other => (
              <Button key={other} label={other.toUpperCase()} variant={other === name ? 'primary' : 'secondary'} onPress={() => switchTo(other)} />
            ))}
            <Button key="quiet" label={quiet ? 'SOUND OFF' : 'SOUND ON'} onPress={toggleQuiet} />
          </Box>
        ))}
      </Box>
    )
  })
}
