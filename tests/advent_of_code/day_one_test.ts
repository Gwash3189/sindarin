import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { expect } from "@std/expect/expect";
import { createNumber } from "../../src/types.ts";

describe("Advent Of Code", () => {
  let lisp: Sindarin;

  beforeEach(() => {
    lisp = new Sindarin();
  });

  describe("when it is day one", () => {
    it("can complete the challenge", () => {
      expect(lisp.evaluate(
        `(require "./tests/advent_of_code/day_one_test.lisp")`,
      )).toEqual(createNumber(11));
    });
  });
});
