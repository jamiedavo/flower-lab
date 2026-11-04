import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, FIELD_SETTINGS, PRESETS, randomizeFlower } from './flowerConfig.js';

const colorKeys = ['Background', 'l1_color', 'l2_color', 'l3_color'];
const shapeKeys = Object.keys(DEFAULT_CONFIG).filter(key => !colorKeys.includes(key));

function assertValid(values) {
  assert.deepEqual(Object.keys(values).sort(), Object.keys(DEFAULT_CONFIG).sort());
  colorKeys.forEach(key => assert.match(values[key], /^#[0-9a-f]{6}$/i));
  for (let index = 1; index <= 3; index += 1) {
    for (const [field, { min, max }] of Object.entries(FIELD_SETTINGS)) {
      const value = values[`l${index}_${field}`];
      assert.ok(Number.isFinite(value), `${field} must be finite`);
      assert.ok(value >= min && value <= max, `${field} ${value} must be within ${min}..${max}`);
      if (field === 'count') assert.ok(Number.isInteger(value));
    }
  }
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test('five distinct presets are complete, valid flowers, beginning with the original', () => {
  assert.equal(PRESETS.length, 5);
  assert.equal(PRESETS[0].id, 'original');
  assert.equal(PRESETS[0].name, 'Original');
  assert.deepEqual(PRESETS[0].values, DEFAULT_CONFIG);
  assert.equal(new Set(PRESETS.map(preset => preset.id)).size, 5);
  assert.equal(new Set(PRESETS.map(preset => JSON.stringify(preset.values))).size, 5);
  PRESETS.forEach(preset => {
    assert.ok(preset.name && preset.description);
    assertValid(preset.values);
    for (let layer = 1; layer <= 3; layer += 1) {
      assert.ok(preset.values[`l${layer}_length`] <= 230);
    }
  });
  assert.equal(DEFAULT_CONFIG.l1_count + DEFAULT_CONFIG.l2_count + DEFAULT_CONFIG.l3_count, 37);
});

test('constrained randomization stays visible, nested, and within all control ranges across seeds', () => {
  const random = seededRandom(2468);
  for (let sample = 0; sample < 500; sample += 1) {
    const result = randomizeFlower(DEFAULT_CONFIG, 'all', random);
    assertValid(result);
    assert.ok(result.l1_length <= 230);
    assert.ok(result.l2_length <= result.l1_length * 0.8);
    assert.ok(result.l3_length <= result.l2_length * 0.8);
    for (let layer = 1; layer <= 3; layer += 1) {
      assert.ok(result[`l${layer}_count`] >= 4 && result[`l${layer}_count`] <= 32);
      assert.ok(result[`l${layer}_opacity`] >= 0.35);
      assert.ok(result[`l${layer}_coreSize`] >= 3);
    }
    assert.notDeepEqual(result, DEFAULT_CONFIG);
  }
});

test('colors-only randomization preserves all geometry and never mutates its input', () => {
  for (const preset of PRESETS) {
    const current = { ...preset.values, l1_count: 99, l3_length: 250 };
    const before = { ...current };
    const result = randomizeFlower(current, 'colors', () => 0);
    assert.notEqual(result, current);
    assert.deepEqual(current, before);
    shapeKeys.forEach(key => assert.equal(result[key], before[key], key));
    assert.ok(colorKeys.some(key => result[key] !== before[key]));
  }
});

test('random source endpoints stay valid and always produce a different palette', () => {
  for (const endpoint of [0, 1]) {
    let previous = DEFAULT_CONFIG;
    for (let iteration = 0; iteration < 12; iteration += 1) {
      const result = randomizeFlower(previous, 'all', () => endpoint);
      assertValid(result);
      assert.notDeepEqual(result, previous);
      assert.ok(colorKeys.some(key => result[key] !== previous[key]));
      previous = result;
    }
  }
});

test('all randomization leaves the source flower and presets intact', () => {
  const current = { ...DEFAULT_CONFIG };
  const before = { ...current };
  randomizeFlower(current, 'all', seededRandom(1));
  assert.deepEqual(current, before);
  assert.deepEqual(PRESETS[0].values, before);
});

test('invalid randomization modes fail explicitly', () => {
  assert.throws(() => randomizeFlower(DEFAULT_CONFIG, 'unknown'), RangeError);
});
