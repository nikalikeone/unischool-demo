import test from 'node:test';
import assert from 'node:assert/strict';
import { plans, getPlan } from '../src/scripts/plans.js';
test('seven plans use agreed monthly prices and subject counts', () => {
  assert.deepEqual(
    plans.map((p) => p.monthly),
    [99, 149, 199, 249, 399, 999, 5199],
  );
  assert.deepEqual(
    plans.map((p) => p.subjects),
    [1, 2, 3, 4, 4, 4, 4],
  );
  assert.equal(new Set(plans.map((p) => p.id)).size, 7);
  assert.equal(getPlan(7).perLesson, 1399);
});
test('daily amounts are stored separately, not derived from monthly payment', () => {
  assert.deepEqual(
    plans.slice(0, 6).map((p) => p.daily),
    [5, 7, 9, 12, 19, 149],
  );
  assert.equal(getPlan(7).daily, undefined);
});
test('lectures, notes and expert review are not added to lower plans', () => {
  assert.equal(
    getPlan(1).features.some((f) => f.includes('Видеолекции')),
    false,
  );
  assert.equal(
    getPlan(5).features.some((f) => f.includes('Видеолекции')),
    true,
  );
  assert.equal(
    getPlan(6).features.some((f) => f.includes('Конспекты')),
    true,
  );
  assert.equal(
    getPlan(7).features.some((f) => f.includes('письменных')),
    true,
  );
});
