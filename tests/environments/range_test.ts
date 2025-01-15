import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { expect } from "@std/expect/expect";

describe("Range", () => {
  let lisp: Sindarin;

  beforeEach(() => {
    lisp = new Sindarin();
  });

  describe("create", () => {
    it("creates a list of the desired range", () => {
      expect(lisp.evaluate(`(Range/create 1 5)`)).toEqual(
        lisp.evaluate(`(List/create 1 2 3 4 5)`),
      );
    });
  });
});
