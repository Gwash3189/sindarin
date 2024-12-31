import { beforeEach, describe, it } from "@std/testing/bdd";
import { ParenSaurus } from "../../src/mod.ts";
import { createList, createString } from "../../src/types.ts";
import { expect } from "@std/expect/expect";

describe("File", () => {
  describe("read-text-file", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("reads the file at the provided path", () => {
      lisp.evaluate(
        `(define contents (File/read-text-file "./test/fixtures/test.lisp"))`,
      );

      expect(lisp.evaluate("(inspect contents)")).toEqual(
        createString("(define test 42)\n"),
      );
    });
  });
});
