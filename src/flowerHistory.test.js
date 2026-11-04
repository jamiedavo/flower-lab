import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistory, historyReducer } from './flowerHistory.js';

const original = { Background: '#111111', l1_count: 12, l1_color: '#ff0055' };
const commit = (state, value) => historyReducer(state, { type: 'commit', value });

test('one commit undoes and redoes a complete multi-property action', () => {
  const initial = createHistory(original);
  const preset = { Background: '#051010', l1_count: 24, l1_color: '#44ffee' };
  const changed = commit(initial, preset);
  const undone = historyReducer(changed, { type: 'undo' });
  const redone = historyReducer(undone, { type: 'redo' });

  assert.deepEqual(undone.present, original);
  assert.deepEqual(redone.present, preset);
  assert.equal(changed.past.length, 1);
  assert.strictEqual(undone.present, initial.present);
  assert.strictEqual(redone.present, changed.present);
  assert.deepEqual(initial.past, []);
  assert.deepEqual(initial.future, []);
});

test('new edits after undo discard the previous redo branch', () => {
  let state = createHistory(original);
  state = commit(state, { ...original, l1_count: 20 });
  state = commit(state, { ...original, l1_count: 30 });
  state = historyReducer(state, { type: 'undo' });
  const branch = commit(state, { ...original, l1_count: 40 });

  assert.equal(state.future.length, 1);
  assert.equal(branch.future.length, 0);
  assert.strictEqual(historyReducer(branch, { type: 'redo' }), branch);
  assert.equal(historyReducer(branch, { type: 'undo' }).present.l1_count, 20);
});

test('equal commits preserve identity and redo history regardless of key order', () => {
  const initial = createHistory(original);
  const changed = commit(initial, { ...original, l1_count: 20 });
  const undone = historyReducer(changed, { type: 'undo' });
  const reordered = { l1_color: '#ff0055', l1_count: 12, Background: '#111111' };

  assert.strictEqual(commit(undone, reordered), undone);
  assert.strictEqual(commit(initial, { ...original }), initial);
  assert.equal(commit(undone, reordered).future.length, 1);
});

test('history retains the most recent 100 undo actions', () => {
  let state = createHistory({ l1_count: 0 });
  for (let count = 1; count <= 125; count += 1) {
    state = commit(state, { l1_count: count });
  }
  assert.equal(state.past.length, 100);
  assert.equal(state.past[0].l1_count, 25);

  for (let step = 0; step < 100; step += 1) {
    state = historyReducer(state, { type: 'undo' });
  }
  assert.equal(state.present.l1_count, 25);
  assert.equal(state.future.length, 100);
  assert.strictEqual(historyReducer(state, { type: 'undo' }), state);

  for (let step = 0; step < 100; step += 1) {
    state = historyReducer(state, { type: 'redo' });
  }
  assert.equal(state.present.l1_count, 125);
  assert.equal(state.past.length, 100);
  assert.equal(state.future.length, 0);
});

test('snapshots are protected from later input mutations', () => {
  const input = { ...original };
  const initial = createHistory(input);
  input.l1_count = 100;
  assert.equal(initial.present.l1_count, 12);

  const next = { ...original, l1_count: 24 };
  const changed = commit(initial, next);
  next.l1_count = 99;
  assert.equal(changed.present.l1_count, 24);
  assert.throws(() => { changed.present.l1_count = 50; }, TypeError);
  assert.equal(historyReducer(changed, { type: 'undo' }).present.l1_count, 12);
});

test('empty undo, empty redo, and unknown actions are stable no-ops', () => {
  const initial = createHistory(original);
  assert.strictEqual(historyReducer(initial, { type: 'undo' }), initial);
  assert.strictEqual(historyReducer(initial, { type: 'redo' }), initial);
  assert.strictEqual(historyReducer(initial, { type: 'unknown' }), initial);
});

test('records with different own keys are distinct even for undefined values', () => {
  const initial = createHistory({ first: undefined });
  const changed = commit(initial, { second: undefined });
  assert.equal(changed.past.length, 1);
  assert.deepEqual(changed.present, { second: undefined });
});
