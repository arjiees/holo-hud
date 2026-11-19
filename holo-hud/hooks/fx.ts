import {
  abs, clamp, exp, fract, length, max, min, picture, pointers, shader, sin, size, smoothstep, still, time, values, vec3, vec4,
} from 'claude-code/shader'

// busy: Claude is working; alert: a tool just failed; r, g, b: the look's glow color.
const v = values({ busy: [0, 1], alert: [0, 1], r: [0, 1], g: [0, 1], b: [0, 1] })

export default shader({
  fps: 30,
  passes: [
    picture(p => {
      const tint = vec3(v.r, v.g, v.b)
      const motion = 1 - still
      let glow = 0

      // A targeting reticle and halo follow each pointer; pressing sends out a ripple.
      for (const ptr of pointers) {
        const d = length(p.point - ptr.at)
        const live = exp(-ptr.gone * 2)
        const ring = smoothstep(2, 0, abs(d - 34 - 4 * sin(time * 3) * motion))
        const tick = smoothstep(1.5, 0, abs(d - 48)) * step4(p.point.x - ptr.at.x, p.point.y - ptr.at.y)
        const halo = exp(-d / 150) * (0.3 + 0.3 * ptr.down)
        const wave = ptr.down * smoothstep(3, 0, abs(d - fract(ptr.age) * 260)) * 0.6
        glow += live * (ring * 0.55 + tick * 0.5 + halo + wave)
      }

      // Working: a bright scan band sweeps down and the whole field breathes.
      const bandY = fract(time * 0.45) * size.y
      const band = exp(-abs(p.point.y - bandY) / 5) * 0.22 * v.busy * motion
      const breath = v.busy * 0.05 * (0.6 + 0.4 * sin(time * 4) * motion)

      // Alert: a red pulse closes in from the edges.
      const edge = smoothstep(0.32, 0.78, length(p.uv - 0.5))
      const red = v.alert * edge * (0.45 + 0.35 * sin(time * 9) * motion)

      const rgb = vec3(min(tint * (glow + band + breath) + vec3(1, 0.12, 0.18) * red, 1))
      const a = clamp(max(rgb.r, max(rgb.g, rgb.b)), 0, 1)

      return vec4(rgb, a)
    }),
  ],
})

// The four short tick marks of the reticle: lit only near the axes.
function step4(dx: number, dy: number): number {
  return max(smoothstep(4, 0, abs(dx)), smoothstep(4, 0, abs(dy)))
}
