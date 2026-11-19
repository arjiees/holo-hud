import { expect, test } from 'claude-code/testing'

const BACKDROP = {
  plugin: 'holo-hud', component: 'Backdrop', requestId: 'b1', surface: 'desktop',
  props: { scene: 'holo', plugin: 'holo-hud', glass: false },
} as const

for (const scene of ['arc', 'holo', 'armor']) {
  test(`the ${scene} backdrop draws on desktop`, async $ => {
    const ui = await $.ui.mount({ ...BACKDROP, props: { ...BACKDROP.props, scene } })
    expect((await ui.find({ type: 'Svg' })) !== undefined).toBe(true)
    await ui.unmount()
  })
}

test('the wall shows live content, the located place, and escapes markup', async ($, on) => {
  let ms = 1_700_000_000_000
  on('command.register', () => ({ value: { command: 'hud' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.now', () => ({ value: (ms += 1000) }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('audio.play', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('http.fetch', () => ({
    value: { status: 200, ok: true, headers: {}, text: JSON.stringify({ success: true, city: 'Test<City', country: 'Nowhere', latitude: 30, longitude: -100 }) },
  }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', () => ({ text: '' }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'echo a<b&c' })
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })

  const ui = await $.ui.mount(BACKDROP)
  const svg = await ui.find({ type: 'Svg' })
  const source = String((svg as { props?: { source?: string } } | undefined)?.props?.source ?? JSON.stringify(svg))
  expect(source).toContain('Bash echo a&lt;b&amp;c')
  expect(source).toContain('TEST&lt;CITY, NOWHERE')
  // latitude 30 seen from a globe tilted 15 degrees: sin(15) of the radius above the middle
  expect(source).toContain('cy="179.1"')
  expect(source).toContain('<polygon points=')
  expect(source.includes('__')).toBe(false)
  await ui.unmount()
})
