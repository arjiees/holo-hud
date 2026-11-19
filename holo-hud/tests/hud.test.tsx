import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'holo-hud',
  component: 'Pane',
  requestId: 'hud',
  surface: 'desktop',
  props: {
    title: 'SYSTEM STATUS',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('the panel logs a failed tool call and counts the alert', async ($, on) => {
  on('command.register', () => ({ value: { command: 'hud' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  let ms = 1_700_000_000_000
  on('clock.now', () => ({ value: (ms += 1000) }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('audio.play', () => ({ value: undefined }))
    on('store.get', () => ({ value: undefined }))
  on('http.fetch', () => ({ value: { status: 503, ok: false, headers: {}, text: '' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', (_, e) =>
    e.tool === 'Bash' ? { result: {}, isError: true, text: 'boom' } : { result: {} },
  )

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Read', file_path: '/a/b/notes.md' })
  await $.tool.call({ tool: 'Bash', command: 'false' })

  const ui = await $.ui.mount(PANE)
  expect((await ui.find({ type: 'Text', text: /ACTIONS/ }))?.text).toContain('ACTIONS 2')
  expect((await ui.find({ type: 'Text', text: /ALERTS/ }))?.text).toContain('ALERTS 1')
  expect((await ui.find({ type: 'Button', key: 'arc' })) !== undefined).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'quiet' })) !== undefined).toBe(true)
  expect((await ui.find({ type: 'Text', text: /✗ Bash false/ })) !== undefined).toBe(true)
  expect((await ui.find({ type: 'Text', text: /✓ Read b\/notes\.md/ })) !== undefined).toBe(true)
  await ui.unmount()
})
