import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { expect } from "@std/expect/expect";

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

  describe("some?", () => {
    describe("when one member of the list passes the predicate", () => {
      it("returns true", () => {
        expect(lisp.evaluate(`
          (List/some? (List/create 2 3 5) Integer/even?)
        `)).toEqual(lisp.evaluate("true"));
      });
    });
  });

  describe("count", () => {
    describe("when given a list", () => {
      it("returns the number of elements in that list", () => {
        expect(lisp.evaluate(`(List/count (List/create 4 2))`))
          .toEqual(lisp.evaluate(`2`));
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

  describe("reduce", () => {
    describe("when a list and a function that sums the list", () => {
      it("returns the sum", () => {
        expect(lisp.evaluate(`
            (List/reduce
              (List/create 1 2)
              (fn (x y) (+ x y))
              0
            )
        `))
          .toEqual(lisp.evaluate(`3`));
      });
    });
  });

  describe("sum", () => {
    describe("when given a list of numbers", () => {
      it("returns the sum", () => {
        expect(lisp.evaluate(`
            (List/sum
              (List/create 1 2)
            )
        `))
          .toEqual(lisp.evaluate(`3`));
      });
    });
  });

  describe("push", () => {
    describe("when given an empty list and an item", () => {
      it("returns a list containing that item", () => {
        expect(lisp.evaluate(`
            (List/push
              (List/create)
              1
            )
        `))
          .toEqual(lisp.evaluate(`(List/create 1)`));
      });
    });

    describe("when given a list containing items and an item", () => {
      it("returns a list containing that item", () => {
        expect(lisp.evaluate(`
            (List/push
              (List/create 2 3)
              1
            )
        `))
          .toEqual(lisp.evaluate(`(List/create 1 2 3)`));
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
