import test from "node:test";
import assert from "node:assert/strict";
import { glide, nearestStop, releaseTarget } from "../app/components/cost-motion.ts";

test("glide accelerates gently, converges without overshoot, and agrees at different refresh rates", () => {
  const samples = [30, 60, 120].map(hz => {
    let position = 0, velocity = 0;
    for (let frame = 0; frame < hz; frame++) {
      const next = glide(position, velocity, 800, 1 / hz, 7);
      assert.ok(next.position >= position && next.position <= 800);
      ({ position, velocity } = next);
    }
    return position;
  });
  assert.ok(Math.abs(samples[0] - samples[2]) < .00001);
  assert.ok(samples[1] > 790 && samples[1] < 800);
  assert.ok(glide(0, 0, 800, 1 / 60, 7).position < 6);
});

test("reversing mid-glide remains continuous and settles at the new destination", () => {
  let state = glide(0, 0, 800, .25, 7);
  const before = state.position;
  state = glide(state.position, state.velocity, 0, 1 / 120, 7);
  assert.ok(Math.abs(state.position - before) < 20);
  for (let frame = 0; frame < 240; frame++) state = glide(state.position, state.velocity, 0, 1 / 120, 7);
  assert.ok(Math.abs(state.position) < .1 && Math.abs(state.velocity) < 1);
});

test("release momentum stays local, ignores paused drags, and clamps to meaningful stops", () => {
  const stops = [0, 800, 1600, 2400, 3200];
  assert.equal(releaseTarget(300, 1000, 20, stops), 800);
  assert.equal(releaseTarget(300, 1000, 180, stops), 0);
  assert.equal(releaseTarget(300, 100000, 20, stops), 800);
  assert.equal(releaseTarget(50, -5000, 20, stops), 0);
  assert.equal(releaseTarget(3150, 5000, 20, stops), 3200);
  assert.equal(nearestStop(1201, stops), 2);
});
