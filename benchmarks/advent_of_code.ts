import { Sindarin } from "../src/mod.ts";

const lisp = new Sindarin();

Deno.bench("Day One, Part One of Advent Of Code", () => {
  lisp.evaluate(`(require "./tests/advent_of_code/day_one_test.sdr")`);
});
