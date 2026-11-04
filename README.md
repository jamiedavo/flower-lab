# Flower Lab

A React/Vite playground for layered, generative SVG flowers.

## Develop

Use Node 20.19+ or 22.12+ (Node 24 is verified).

```sh
npm ci
npm run dev
```

```sh
npm test       # 13 tests for presets, constrained randomization, and history
npm run lint
npm run build
```

## Explore

- Choose Original, Sunburst, Moon Orchid, Sea Glass, or Ember as a starting point.
- **Randomize flower** uses coordinated palettes and bounded, nested shapes. The
  detailed layer controls still allow a wider range of manual edits.
- **Randomize colors** changes only the background and three layer colors.
- **Undo / Redo** restores the entire flower, including colors and all layer
  settings. Each preset, randomization, slider drag, or focused input edit is one
  step. Multiple Enter-confirmed changes in the same input form one step until
  that input loses focus. History retains up to 100 steps for the current session.
- Use Ctrl/Cmd+Z to undo and Ctrl/Cmd+Shift+Z (or Ctrl+Y) to redo. Text inputs keep
  their native editing shortcuts while focused.
- On mobile, **Show Controls / Hide Controls** toggles the editor below the flower.
  Toolbar actions remain accessible while the editor scrolls.
- **Export PNG** downloads a 1000×1000 image with the current background.

Presets, edits, and history are held in memory; refreshing starts with Original.

## Framework

React 19, Vite 8, and Leva. The application runs entirely in the browser.
