import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { expect } from "@std/expect/expect";
import { createNumber } from "../../src/types.ts";

describe("require", () => {
  let lisp: Sindarin;

  beforeEach(() => {
    lisp = new Sindarin();
  });

  it("loads and evaluate a file", () => {
    lisp.evaluate('(require "./tests/fixtures/test.sdr")');
    expect(lisp.evaluate(`(inspect test)`)).toEqual(createNumber(42));
  });

  it("throws an error if the file does not exist", () => {
    expect(() => lisp.evaluate('(require "./test/fixtures/missing.sdr")'))
      .toThrow("Module not found: ./test/fixtures/missing.sdr");
  });
});
