import { beforeEach, describe, it } from "@std/testing/bdd";
import { ParenSaurus } from "../../src/mod.ts";
import { expect } from "@std/expect/expect";
import { createNumber, isList } from "../../src/types.ts";

describe("require", () => {
  let lisp: ParenSaurus;

  beforeEach(() => {
    lisp = new ParenSaurus();
  });

  it("loads and evaluate a file", () => {
    lisp.evaluate('(require "./test/fixtures/test.lisp")');
    expect(lisp.env.get("test")).toEqual(createNumber(42));
  });

  it("throws an error if the file does not exist", () => {
    expect(() => lisp.evaluate('(require "./test/fixtures/missing.lisp")'))
      .toThrow("Module not found: ./test/fixtures/missing.lisp");
  });
});
