# holo-hud

A sci-fi heads-up display for Claude Code's desktop app: a mod that changes how a session looks and gives it a live control wall.

## What it does

- **Three looks:** `arc` (icy white-blue), `holo` (cyan) and `armor` (red and gold).
- **Animated backdrop:** a rotating reactor dial, falling matrix code, and side panels showing files changed, recent activity, a calendar, session telemetry and a clock.
- **Globe:** a low-poly Earth turned to face your location, with a marker on it.
- **Pointer effects:** a reticle and glow follow the cursor; clicking sends out a ripple.
- **Status panel:** mission clock, core state, counts and an activity log, with buttons to switch look and mute sound.
- **Sounds:** short chimes, plus spoken lines for long tasks and failures (macOS).

## Privacy

At the start of each session the mod sends one request to `https://ipwho.is/` to find a city-level location for the globe. That service sees your IP address. Nothing else is sent anywhere.

## Install

At the prompt of a terminal session:

```
/plugin install holo-hud --marketplace arjiees/holo-hud
```

From a shell:

```
claude plugin install holo-hud --marketplace arjiees/holo-hud
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `arjiees/holo-hud`, then Add plugin.

## Use

- `/hud arc`, `/hud holo`, `/hud armor`: switch look. The reply also reports whether the theme and location lookup worked.
- `/hud panel`: open the status panel.
- `/hud quiet`: turn sounds and voice off or on.
- `/hud font`: draw chat messages in the panel's monospaced font, or switch back. While it is on, formatting in replies shows as plain symbols and links are not clickable.

The look draws in the desktop and mobile apps only. The continents are rough hand-drawn outlines, not an accurate map.
