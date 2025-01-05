import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { expect } from "@std/expect/expect";
import { createBoolean } from "../../src/types.ts";

describe("List", () => {
  let lisp: Sindarin;

  beforeEach(() => {
    lisp = new Sindarin();
  });

  describe("at", () => {
    it("gets the element at the index of the provided list", () => {
      lisp.evaluate(`(define list (List/create 1 2 3))`);

      expect(lisp.evaluate(`(List/at list 0)`)).toEqual(lisp.evaluate(`1`));
    });

    describe("when given a number that is out of bounds", () => {
      it("throws a an EvalError", () => {
        lisp.evaluate(`(define list (List/create 1 2 3))`);

        expect(() => lisp.evaluate(`(List/at list -1)`)).toThrow(
          EvalError("index out of range"),
        );
        expect(() => lisp.evaluate(`(List/at list 4)`)).toThrow(
          EvalError("index out of range"),
        );
      });
    });
  });

  describe("map", () => {
    it("returns a new array with the returned values", () => {
      expect(lisp.evaluate(`
        (inspect
          (List/map
            (List/create 1 2 3)
            (fn
              (item index)
                (+ item 1)
            )
          )
        )
      `)).toEqual(lisp.evaluate(`(List/create 2 3 4)`));
    });
  });

  describe("every?", () => {
    describe("when every member of the list passes the predicate", () => {
      it("returns true", () => {
        expect(lisp.evaluate(`
          (List/every? (List/create 2 4 6) Integer/even?)
        `)).toEqual(lisp.evaluate("true"));
      });
    });
  });

  describe("sort", () => {
    describe("when given an sortable list", () => {
      it("sorts it according to deno Array.sort", () => {
        expect(lisp.evaluate(`(List/sort (List/create 4 3 5 3 9 3))`))
          .toEqual(lisp.evaluate(`(List/create 3 3 3 4 5 9)`));
      });
    });
  });

  describe("each", () => {
    it("iterates over a list", () => {
      lisp.evaluate(`(begin
        (define list (List/create 1 2 3))
        (define store (Hash/create))
      )`);
      lisp.evaluate(
        `(List/each
          list
          (fn (_ index) (Hash/set store index (+ index 1))
          ))`,
      );

      expect(lisp.evaluate(`(inspect store)`)).toEqual(
        lisp.evaluate(`(inspect #{"0" 1 "1" 2 "2" 3 })`),
      );
    });
  });
});
