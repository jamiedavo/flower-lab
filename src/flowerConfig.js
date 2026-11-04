export const FIELD_SETTINGS = Object.freeze({
  count: { min: 1, max: 100, step: 1 },
  length: { min: 10, max: 300, step: 1 },
  width: { min: 2, max: 150, step: 1 },
  curvature: { min: 0, max: 1, step: 0.01 },
  taper: { min: -50, max: 50, step: 1 },
  rotateOffset: { min: 0, max: 360, step: 1 },
  opacity: { min: 0, max: 1, step: 0.01 },
  coreSize: { min: 0, max: 100, step: 1 },
});

const layer = (count, length, width, curvature, taper, rotateOffset, opacity, coreSize, color) => ({
  count, length, width, curvature, taper, rotateOffset, opacity, coreSize, color,
});

function flower(background, layers) {
  return Object.freeze(Object.assign(
    { Background: background },
    ...layers.map((settings, index) => Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [`l${index + 1}_${key}`, value]),
    )),
  ));
}

export const DEFAULT_CONFIG = flower('#111111', [
  layer(12, 200, 40, 0.5, 10, 0, 0.5, 15, '#ff0055'),
  layer(20, 150, 20, 0.8, -10, 15, 0.6, 10, '#0099ff'),
  layer(5, 100, 80, 0.2, 20, 45, 0.8, 5, '#ffcc00'),
]);

export const PRESETS = Object.freeze([
  Object.freeze({
    id: 'original', name: 'Original',
    description: 'Electric pink, blue, and gold in three overlapping layers.',
    values: DEFAULT_CONFIG,
  }),
  Object.freeze({
    id: 'sunburst', name: 'Sunburst',
    description: 'Fine golden rays around a warm, glowing center.',
    values: flower('#171008', [
      layer(32, 225, 18, 0.82, -8, 0, 0.46, 14, '#ff8a3d'),
      layer(24, 168, 28, 0.64, 6, 7, 0.63, 10, '#ffcd55'),
      layer(12, 86, 34, 0.38, 14, 15, 0.82, 8, '#fff1b0'),
    ]),
  }),
  Object.freeze({
    id: 'moon-orchid', name: 'Moon Orchid',
    description: 'Broad violet petals with a pale moonlit heart.',
    values: flower('#100d1b', [
      layer(5, 210, 105, 0.3, 34, 18, 0.54, 12, '#a38bff'),
      layer(7, 152, 74, 0.42, 26, 44, 0.58, 8, '#ef91cf'),
      layer(5, 82, 48, 0.24, 20, 54, 0.8, 6, '#e8dbff'),
    ]),
  }),
  Object.freeze({
    id: 'sea-glass', name: 'Sea Glass',
    description: 'Airy teal filaments layered with cool blue and mint.',
    values: flower('#071819', [
      layer(28, 220, 22, 0.9, -18, 0, 0.38, 10, '#39c9b1'),
      layer(18, 154, 38, 0.65, -8, 10, 0.56, 8, '#5db3ff'),
      layer(8, 90, 50, 0.4, 15, 22, 0.7, 5, '#bbffdb'),
    ]),
  }),
  Object.freeze({
    id: 'ember', name: 'Ember',
    description: 'Flame-like crimson petals with an amber center.',
    values: flower('#1b0b10', [
      layer(16, 220, 52, 0.72, -20, 10, 0.52, 14, '#fa4763'),
      layer(12, 158, 46, 0.56, 14, 25, 0.64, 9, '#ff944d'),
      layer(8, 88, 42, 0.3, 20, 40, 0.82, 6, '#ffe28a'),
    ]),
  }),
]);

const PALETTES = [
  ['#111111', '#ff0055', '#0099ff', '#ffcc00'],
  ['#171008', '#ff8a3d', '#ffcd55', '#fff1b0'],
  ['#100d1b', '#a38bff', '#ef91cf', '#e8dbff'],
  ['#071819', '#39c9b1', '#5db3ff', '#bbffdb'],
  ['#1b0b10', '#fa4763', '#ff944d', '#ffe28a'],
  ['#0a1420', '#5f8cff', '#76e4d9', '#f1c5ff'],
];

const COLOR_KEYS = ['Background', 'l1_color', 'l2_color', 'l3_color'];

/**
 * Generate a coordinated palette and, in all mode, nested, visible petal layers.
 * The editable control ranges remain wider than these exploration ranges.
 * An injectable random source makes boundary cases and seeded sessions reproducible.
 */
export function randomizeFlower(current = DEFAULT_CONFIG, mode = 'all', random = Math.random) {
  if (mode !== 'all' && mode !== 'colors') {
    throw new RangeError('Randomization mode must be all or colors.');
  }

  const sample = () => {
    const value = random();
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  };
  const integer = (min, max) => Math.min(max, min + Math.floor(sample() * (max - min + 1)));
  const decimal = (min, max) => Math.round((min + sample() * (max - min)) * 100) / 100;
  const values = { ...DEFAULT_CONFIG, ...current };

  // Excluding the current palette guarantees a useful change even with a fixed RNG.
  const candidates = PALETTES.filter(palette => COLOR_KEYS.some((key, index) => values[key] !== palette[index]));
  const palette = candidates[integer(0, candidates.length - 1)];
  COLOR_KEYS.forEach((key, index) => { values[key] = palette[index]; });
  if (mode === 'colors') return values;

  const outerLength = integer(175, 230);
  const middleLength = integer(110, Math.min(175, Math.floor(outerLength * 0.8)));
  const innerLength = integer(60, Math.min(110, Math.floor(middleLength * 0.8)));
  const layerRanges = [
    { length: outerLength, count: [8, 32], width: [18, 72], opacity: [0.35, 0.62] },
    { length: middleLength, count: [6, 24], width: [16, 65], opacity: [0.45, 0.72] },
    { length: innerLength, count: [4, 14], width: [18, 60], opacity: [0.6, 0.88] },
  ];
  layerRanges.forEach((range, index) => {
    const prefix = `l${index + 1}_`;
    const width = integer(...range.width);
    const taperLimit = Math.min(40, Math.floor(width * 0.6));
    Object.assign(values, {
      [`${prefix}count`]: integer(...range.count),
      [`${prefix}length`]: range.length,
      [`${prefix}width`]: width,
      [`${prefix}curvature`]: decimal(0.25, 0.9),
      [`${prefix}taper`]: integer(-taperLimit, taperLimit),
      [`${prefix}rotateOffset`]: integer(0, 359),
      [`${prefix}opacity`]: decimal(...range.opacity),
      [`${prefix}coreSize`]: integer(3, 18 - index * 4),
    });
  });
  return values;
}
