import test from "node:test";
import assert from "node:assert/strict";
import { storyProduct, storyResult, storyStages, lifecycleStages, storyIndex } from "../app/components/cost-story-model.ts";
import { analyzeProduct } from "../app/products/product-calculations.ts";

test("editorial scenes and exploration retain the same correct receipt assumptions", () => {
  assert.deepEqual(storyResult, analyzeProduct(storyProduct));
  assert.equal(storyResult.net, 1129);
  assert.equal(storyResult.ownership, 540);
  assert.equal(storyResult.totalUses, 520);
  assert.equal(storyStages[4].value, lifecycleStages[3].value);
  assert.equal(lifecycleStages[4].value, "$2.17");
});

test("native scroll stages clamp overscroll and return the correct boundary states", () => {
  assert.deepEqual([-.2, 0, .199, .2, .4, .6, .8, 1, 2].map(storyIndex), [0, 0, 0, 1, 2, 3, 4, 4, 4]);
  assert.equal(storyIndex(NaN), 0);
  assert.equal(storyIndex(Infinity), 0);
});
