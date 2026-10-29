import test from "node:test";
import assert from "node:assert/strict";
import { suggestRssCategory } from "../lib/rss-category.mjs";

test("publisher categories produce strong suggestions", () => {
  assert.equal(
    suggestRssCategory({ title: "A new report", categories: ["Technology"] }),
    "Technology",
  );
  assert.equal(
    suggestRssCategory({ title: "A new report", categories: ["Environment"] }),
    "Climate",
  );
  assert.equal(
    suggestRssCategory({ title: "A new report", categories: ["Economics & Business"] }),
    "Finance",
  );
  assert.equal(
    suggestRssCategory({ title: "A new report", categories: ["Gaming"] }),
    "Gaming",
  );
});

test("title keywords are used when publisher categories do not match", () => {
  assert.equal(
    suggestRssCategory({ title: "AI-powered tools change education" }),
    "Technology",
  );
  assert.equal(
    suggestRssCategory({ title: "Renewable energy cuts emissions" }),
    "Climate",
  );
  assert.equal(
    suggestRssCategory({ title: "Financial markets react to trade news" }),
    "Finance",
  );
  assert.equal(
    suggestRssCategory({ title: "A new Nintendo video game arrives" }),
    "Gaming",
  );
});

test("World remains the safe fallback for uncertain stories", () => {
  assert.equal(
    suggestRssCategory({
      title: "Youth campaign for representation",
      categories: ["Politics", "Human Rights"],
    }),
    "World",
  );
});

test("specific technology metadata outranks unrelated title wording", () => {
  assert.equal(
    suggestRssCategory({
      title: "Digital finance rules are changing",
      categories: ["Technology"],
    }),
    "Technology",
  );
});
