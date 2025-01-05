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
        `
        (begin
          (def left-list (List/create))
          (def right-list (List/create))
          (def contents
            (String/split
              (String/trim
                (File/read-text-file "test/advent_of_code/text.txt")
              ) "\n"
            )
          )
          (def number-tuples
            (List/map contents
              (fn (item)
                (List/map
                  (String/split item "   ")
                  (fn (str)
                    (begin
                      (def result (Integer/parse str))
                      (if (Core/error? result)
                        (exit "Error parsing int")
                        result
                      )
                    )
                  )
                )
              )
            )
          )
          (begin
            (List/each number-tuples
              (fn (number-tuple index)
                (begin
                  (List/push left-list (List/at number-tuple 0))
                  (List/push right-list (List/at number-tuple 1))
                )
              )
            )
          )
          (begin
            (define sum 0)
            (define right-list (List/sort right-list))
            (define left-list (List/sort left-list))
            (define distances
              (List/map left-list
                (fn
                  (numb index)
                  (- (List/at right-list index) numb)
                )
              )
            )
            (List/reduce distances 0 (fn (acc current) (+ acc current)))
          )
        )`,
      )).toEqual(createNumber(11));
    });
  });
});
