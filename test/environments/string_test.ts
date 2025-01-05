import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { createList, createString } from "../../src/types.ts";
import { expect } from "@std/expect/expect";

describe("String", () => {
  let lisp: Sindarin;

  beforeEach(() => {
    lisp = new Sindarin();
  });

  describe("trim", () => {
    it("trims the leading and trailing whitespace from a string", () => {
      expect(lisp.evaluate(
        `
          (List/map
            (String/split
              (String/trim "3   4
4   3
2   5
1   3
3   9
3   3
") "\n") (fn (item) (String/split item "   ")))
        `,
      )).toEqual(lisp.evaluate(`
        (inspect
          (List/create
            (List/create "3" "4")
            (List/create "4" "3")
            (List/create "2" "5")
            (List/create "1" "3")
            (List/create "3" "9")
            (List/create "3" "3")
          )
        )`));
    });
  });

  describe("split", () => {
    it("splits the string by the provided value", () => {
      lisp.evaluate(`(define numbers (String/split "1,2,3" ","))`);

      expect(lisp.evaluate("(inspect numbers)")).toEqual(
        createList([
          createString("1"),
          createString("2"),
          createString("3"),
        ]),
      );
    });

    describe("when given non string arguments", () => {
      it("throws an error", () => {
        expect(() => lisp.evaluate(`(String/split "1,2,3" 1)`)).toThrow(
          "String/split requires string arguments",
        );
        expect(() => lisp.evaluate(`(String/split 1 "1")`)).toThrow(
          "String/split requires string arguments",
        );
      });
    });

    describe("when given less than two arguments", () => {
      it("throws an error", () => {
        expect(() => lisp.evaluate(`(String/split "1,2,3")`)).toThrow(
          "String/split needs two arguments",
        );
        expect(() => lisp.evaluate(`(String/split)`)).toThrow(
          "String/split needs two arguments",
        );
      });
    });

    describe("when given null as the first argument", () => {
      it("returns an empty list", () => {
        expect(lisp.evaluate(`(String/split null ",")`)).toEqual(
          createList([]),
        );
      });
    });

    describe("when given an empty string as the first argument", () => {
      it("returns an array with an empty string", () => {
        expect(lisp.evaluate(`(List/at (String/split "" ",") 0)`)).toEqual(
          createString(""),
        );
      });
    });
  });

  describe("replace", () => {
    it("replaces the character sequence within the provided string", () => {
      expect(lisp.evaluate(`(String/replace "(define test 42)\n" "\n" "")`))
        .toEqual(
          createString("(define test 42)"),
        );
    });
  });
});
