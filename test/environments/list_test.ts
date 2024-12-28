import { beforeEach, describe, it } from "@std/testing/bdd";
import { ParenSaurus } from "../../src/mod.ts";
import { expect } from "@std/expect/expect";
import { createHash, createNull, createNumber } from "../../src/types.ts";

describe("List", () => {
  let lisp: ParenSaurus

  beforeEach(() => {
    lisp = new ParenSaurus()
  })

  describe("element", () => {
    it('gets the element of the provided list', () => {
      lisp.evaluate(`(define list (List/create 1 2 3))`)

      expect(lisp.evaluate(`(List/element list 0)`)).toEqual(createNumber(1))
    })

    describe('when given a number that is out of bounds', () => {
      it('throws a an EvalError', () => {
        lisp.evaluate(`(define list (List/create 1 2 3))`)

        expect(() => lisp.evaluate(`(List/element list -1)`)).toThrow(EvalError('index out of range'))
        expect(() => lisp.evaluate(`(List/element list 4)`)).toThrow(EvalError('index out of range'))
      })
    })
  })

  describe("each", () => {
    it('iterates over a list', () => {
      lisp.evaluate(`(define list (List/create 1 2 3))`)
      lisp.evaluate(`(define store (Hash/create))`)
      lisp.evaluate(`(List/each list (lambda (index) (Hash/set store index (+ index 1))))`)

      expect(lisp.evaluate(`(inspect store)`)).toEqual(
        createHash(
          new Map()
            .set("0", createNumber(1))
            .set("1", createNumber(2))
            .set("2", createNumber(3))
        )
      )
    })
  })
})
