import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { createString } from "../../src/types.ts";
import { expect } from "@std/expect/expect";

describe("File", () => {
  describe("read-text-file", () => {
    let lisp: Sindarin;

    beforeEach(() => {
      lisp = new Sindarin();
    });

    it("reads the file at the provided path", () => {
      lisp.evaluate(
        `(define contents (File/read-text-file "./tests/fixtures/test.sdr"))`,
      );

      expect(lisp.evaluate("(inspect contents)")).toEqual(
        createString("(define test 42)\n"),
      );
    });
  });
});
