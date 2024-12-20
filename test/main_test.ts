import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { createList, createNull, createNumber, createString } from "../src/types.ts";
import { ParenSaurus } from "../src/mod.ts";
import { tokenize } from "../src/tokeniser.ts";
import { parse } from "../src/parser.ts";

// integration.test.ts

describe("ParenSaurus Integration Tests", () => {
  describe("Arithmetic Operations", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    describe("addition", () => {
      it("should add two numbers", () => {
        expect(lisp.evaluate("(+ 1 2)"))
          .toEqual(createNumber(3));
      });

      it("should add multiple numbers", () => {
        expect(lisp.evaluate("(+ 1 2 3 4)"))
          .toEqual(createNumber(10));
      });

      it("should return 0 when no arguments provided", () => {
        expect(lisp.evaluate("(+)"))
          .toEqual(createNumber(0));
      });

      it("should return the same number when one argument provided", () => {
        expect(lisp.evaluate("(+ 5)"))
          .toEqual(createNumber(5));
      });
    });

    describe("multiplication", () => {
      it("should multiply two numbers", () => {
        expect(lisp.evaluate("(* 2 3)"))
          .toEqual(createNumber(6));
      });

      it("should multiply multiple numbers", () => {
        expect(lisp.evaluate("(* 2 3 4)"))
          .toEqual(createNumber(24));
      });

      it("should return 1 when no arguments provided", () => {
        expect(lisp.evaluate("(*)"))
          .toEqual(createNumber(1));
      });

      it("should return the same number when one argument provided", () => {
        expect(lisp.evaluate("(* 5)"))
          .toEqual(createNumber(5));
      });
    });

    describe("subtraction", () => {
      it("should subtract two numbers", () => {
        expect(lisp.evaluate("(- 10 3)"))
          .toEqual(createNumber(7));
      });

      it("should subtract multiple numbers from left to right", () => {
        expect(lisp.evaluate("(- 10 3 2)"))
          .toEqual(createNumber(5));
      });

      it("should negate a single number", () => {
        expect(lisp.evaluate("(- 5)"))
          .toEqual(createNumber(-5));
      });

      it("should throw error when no arguments provided", () => {
        expect(() => lisp.evaluate("(-)"))
          .toThrow("- requires at least one argument");
      });
    });

    describe("division", () => {
      it("should divide two numbers", () => {
        expect(lisp.evaluate("(/ 10 2)"))
          .toEqual(createNumber(5));
      });

      it("should divide multiple numbers from left to right", () => {
        expect(lisp.evaluate("(/ 20 2 2)"))
          .toEqual(createNumber(5));
      });

      it("should handle decimal results", () => {
        expect(lisp.evaluate("(/ 10 3)"))
          .toEqual(createNumber(10 / 3));
      });

      it("should throw error when dividing by zero", () => {
        expect(() => lisp.evaluate("(/ 10 0)"))
          .toThrow("division by zero error");
      });

      it("should throw error when no arguments provided", () => {
        expect(() => lisp.evaluate("(/)"))
          .toThrow("/ requires at least one argument");
      });
    });
  });

  describe("#{} syntax", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    describe("when defining a hash", () => {
      it("assigns the hash to a variable", () => {
        lisp.evaluate('(define person #{ :name "John" })');
        expect(lisp.evaluate('person')).toBeTruthy();
      });

      it("allows multiple key-value pairs", () => {
        lisp.evaluate('(define person #{ :name "John" :age 30 :city "New York" })');
        expect(lisp.evaluate('(hash-get person :name)')).toEqual(createString("John"));
        expect(lisp.evaluate('(hash-get person :age)')).toEqual(createNumber(30));
        expect(lisp.evaluate('(hash-get person :city)')).toEqual(createString("New York"));
      });

      it("returns null for non-existent keys", () => {
        lisp.evaluate('(define person #{ :name "John" })');
        expect(lisp.evaluate('(hash-get person :unknown)')).toEqual(createNull());
      });

      it("can be nested", () => {
        lisp.evaluate(`
          (define person #{
            :name "John"
            :address #{
              :city "New York"
              :country "USA"
            }
          })
        `);
        expect(lisp.evaluate('(hash-get (hash-get person :address) :city)'))
          .toEqual(createString("New York"));
      });
    });
  });

  describe("Variable Definitions", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should define and use variables", () => {
      lisp.evaluate("(define x 42)");
      expect(
        lisp.evaluate("x"),
      ).toEqual(
        createNumber(42),
      );
    });

    it("should define variables using other variables", () => {
      lisp.evaluate("(define x 42)");
      lisp.evaluate("(define y (+ x 8))");
      expect(
        lisp.evaluate("y"),
      ).toEqual(
        createNumber(50),
      );
    });
  });

  describe("Functions", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should define and call simple functions", () => {
      lisp.evaluate(`
        (define add1
          (lambda (x)
            (+ x 1)))
      `);

      expect(
        lisp.evaluate("(add1 5)"),
      ).toEqual(
        createNumber(6),
      );
    });

    it("should handle closures", () => {
      lisp.evaluate(`
        (define make-adder
          (lambda (x)
            (lambda (y)
              (+ x y))))
      `);

      lisp.evaluate("(define add5 (make-adder 5))");

      expect(
        lisp.evaluate("(add5 10)"),
      ).toEqual(
        createNumber(15),
      );
    });
  });

  describe("List Operations", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should get the head of a list", () => {
      expect(
        lisp.evaluate("(head (list 1 2 3))"),
      ).toEqual(
        createNumber(1),
      );
    });

    it("should get the tail of a list", () => {
      expect(
        lisp.evaluate("(tail (list 1 2 3))"),
      ).toEqual(
        createList([createNumber(2), createNumber(3)]),
      );
    });

    it("should construct new lists with cons", () => {
      expect(
        lisp.evaluate("(cons 1 (list 2 3))"),
      ).toEqual(
        createList([createNumber(1), createNumber(2), createNumber(3)]),
      );
    });
  });

  describe("Conditionals", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should evaluate true conditions", () => {
      expect(
        lisp.evaluate("(if (> 5 3) 1 2)"),
      ).toEqual(
        createNumber(1),
      );
    });

    it("should evaluate false conditions", () => {
      expect(
        lisp.evaluate("(if (< 5 3) 1 2)"),
      ).toEqual(
        createNumber(2),
      );
    });
  });

  describe("Error Handling", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should handle syntax errors", () => {
      expect(
        () => lisp.evaluate("("),
      ).toThrow(
        Error,
      );
    });

    it("should handle undefined variables", () => {
      expect(
        () => lisp.evaluate("undefined-var"),
      ).toThrow(
        Error,
      );
    });

    it("should handle type errors", () => {
      expect(
        () => lisp.evaluate('(+ 1 "2")'),
      ).toThrow(
        Error,
      );
    });
  });

  describe("Complex Programs", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    describe("Factorial", () => {
      beforeEach(() => {
        lisp.evaluate(`
          (define factorial
            (lambda (n)
              (if (= n 0)
                  1
                  (* n (factorial (- n 1))))))
        `);
      });

      it("should calculate factorial of 5", () => {
        expect(
          lisp.evaluate("(factorial 5)"),
        ).toEqual(
          createNumber(120),
        );
      });

      it("should handle factorial of 0", () => {
        expect(
          lisp.evaluate("(factorial 0)"),
        ).toEqual(
          createNumber(1),
        );
      });
    });

    describe("Fibonacci", () => {
      beforeEach(() => {
        lisp.evaluate(`
          (define fib
            (lambda (n)
              (if (< n 2)
                  n
                  (+ (fib (- n 1))
                     (fib (- n 2))))))
        `);
      });

      it("should calculate fibonacci of 7", () => {
        expect(
          lisp.evaluate("(fib 7)"),
        ).toEqual(
          createNumber(13),
        );
      });

      it("should handle fibonacci of small numbers", () => {
        expect(
          lisp.evaluate("(fib 0)"),
        ).toEqual(
          createNumber(0),
        );
        expect(
          lisp.evaluate("(fib 1)"),
        ).toEqual(
          createNumber(1),
        );
      });
    });
  });
});
