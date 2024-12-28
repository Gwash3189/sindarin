import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import {
  createList,
  createNull,
  createNumber,
  createString,
  createSymbol,
  LispVal,
} from "../src/types.ts";
import { ParenSaurus } from "../src/mod.ts";
import { createBoolean } from "../src/types.ts";

// integration.test.ts

describe("ParenSaurus Integration Tests", () => {
  describe("Language Features", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should support all core language features", () => {
      // Define a list of numbers
      lisp.evaluate(`
        (define numbers (List/create 1 2 3 4 5))

        (define even?
          (lambda (x)
            (if (= (Core/type? x) "number")
                (= (% x 2) 0)
                false)))

        (define positive?
          (lambda (x)
            (if (= (Core/type? x) "number")
                (> x 0)
                false)))
      `);

      // Define a function that squares a number
      lisp.evaluate(`
        (define square
          (lambda (x)
            (* x x)))
      `);

      // Define a hash map of user data
      lisp.evaluate(`
        (define user #{
          :name "John"
          :age 30
          :scores (List/create 85 92 78 95)
        })
      `);

      // Test predicate functions
      expect(lisp.evaluate("(even? 4)")).toEqual(createBoolean(true));
      expect(lisp.evaluate("(even? 3)")).toEqual(createBoolean(false));
      expect(lisp.evaluate("(positive? 5)")).toEqual(createBoolean(true));
      expect(lisp.evaluate("(positive? -1)")).toEqual(createBoolean(false));

      // Test arithmetic and function application
      expect(lisp.evaluate("(square 5)")).toEqual(createNumber(25));
      expect(lisp.evaluate("(+ (* 2 3) (/ 10 2))")).toEqual(createNumber(11));

      // Test conditional with complex predicate
      lisp.evaluate(`
        (define check-age
          (lambda (person threshold)
            (if (> (Hash/get person :age) threshold)
                "Adult"
                "Minor")))
      `);
      expect(lisp.evaluate("(check-age user 18)")).toEqual(
        createString("Adult"),
      );
      expect(lisp.evaluate("(check-age user 40)")).toEqual(
        createString("Minor"),
      );

      // // Test list manipulation and null handling
      expect(lisp.evaluate("(List/head (List/tail numbers))")).toEqual(
        createNumber(2),
      );
      expect(lisp.evaluate("(Core/null? (List/create))")).toEqual(
        createBoolean(false),
      );
      expect(lisp.evaluate("(Core/null? numbers)")).toEqual(
        createBoolean(false),
      );

      // // Test closures
      lisp.evaluate(`
        (define make-adder
          (lambda (x)
            (lambda (y)
              (+ x y))))
      `);
      lisp.evaluate("(define add5 (make-adder 5))");
      expect(lisp.evaluate("(add5 3)")).toEqual(createNumber(8));

      lisp.evaluate(`
        (define filter
          (lambda (predicate lst)
            (if (Core/null? lst)
                (List/create)
                (if (predicate (List/head lst))
                    (List/concat (List/head lst) (filter predicate (List/tail lst)))
                    (filter predicate (List/tail lst)))
          )))
        `);

      // Test complex expression with multiple features
      lisp.evaluate(`
        (define process-scores
          (lambda (user min-score)
            (if (> (Hash/get user :age) 20)
                (filter (lambda (score) (> score min-score))
                       (Hash/get user :scores))
                (List/create))))
      `);

      expect(lisp.evaluate("(process-scores user 85)"))
        .toEqual(createList([createNumber(92), createNumber(95)]));

      expect(lisp.evaluate("'(a b c)"))
        .toEqual(
          createList([createSymbol("a"), createSymbol("b"), createSymbol("c")]),
        );
    });
  });

  describe("Comments", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("ignores comments", () => {
      expect(lisp.evaluate("(+ 1 2) ; comment")).toEqual(createNumber(3));
    });

    it("ignores comments even when they contain code", () => {
      expect(lisp.evaluate(";(defn x () (inspect x))")).toEqual(createList([]));
    });
  });

  describe("js-eval", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should evaluate JS code", () => {
      expect(lisp.evaluate('(js-eval "1 + 2")')).toEqual(createNumber(3));
    });

    it("should evaluate complex JS code", () => {
      expect(
        lisp.evaluate(
          "(js-eval \"Deno.readTextFileSync('test/fixtures/test.lisp')\")",
        ),
      ).toEqual(createString("(define test 42)\n"));
    });

    it("should handle JS errors", () => {
      expect(lisp.evaluate("(js-eval \"throw new Error('error')\")"))
        .toEqual({
          type: "error",
          value: "error",
        });
    });
  });

  describe("Core/error?", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should return true for error values", () => {
      expect(lisp.evaluate('(Core/error? (Core/error "error"))')).toEqual(
        createBoolean(true),
      );
    });

    it("should return false for non-error values", () => {
      expect(lisp.evaluate("(Core/error? 42)")).toEqual(createBoolean(false));
    });

    it("can be used in conditionals", () => {
      expect(lisp.evaluate(`
      (
        if (Core/error? (Core/error "Oh No!"))
        1
        2
      )
        `)).toEqual(createNumber(1));
    });
  });

  describe("and special form", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    describe("defn", () => {
      let result: LispVal;

      beforeEach(() => {
        result = lisp.evaluate("(defn add (x y) (+ x y))");
      });

      it("defines a function", () => {
        expect(result).toHaveProperty(
          "type",
          lisp.env.get("add").type,
        );
      });

      it("attaches the correct body to the function", () => {
        expect(result).toHaveProperty("value", lisp.env.get("add").value);
      });
    });

    it("should return true for empty and", () => {
      expect(lisp.evaluate("(and)")).toEqual(createBoolean(true));
    });

    it("should return single value for single argument", () => {
      expect(lisp.evaluate("(and 42)")).toEqual(createNumber(42));
    });

    it("should return false if any argument is false", () => {
      expect(lisp.evaluate("(and true false true)")).toEqual(
        createBoolean(false),
      );
    });

    it("should return last value if all are truthy", () => {
      expect(lisp.evaluate("(and 1 2 3)")).toEqual(createNumber(3));
    });

    it("should short-circuit on first false", () => {
      // Define a function that will throw if called
      lisp.evaluate(`
        (define will-error
          (lambda ()
            (/ 1 0)))
      `);

      // If and short-circuits correctly, will-error won't be called
      expect(lisp.evaluate("(and false (will-error))")).toEqual(
        createBoolean(false),
      );
    });

    it("should work with complex expressions", () => {
      expect(lisp.evaluate("(and (> 5 3) (< 2 4))")).toEqual(
        createBoolean(true),
      );
      expect(lisp.evaluate("(and (> 5 3) (> 2 4))")).toEqual(
        createBoolean(false),
      );
    });
  });

  describe("print", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should return the value", () => {
      expect(lisp.evaluate('(print "hello")')).toEqual(createString("hello"));
    });

    describe("when a hash is printed", () => {
      describe("when make-hash is used", () => {
        beforeEach(() => {
          lisp.evaluate(`(defn make-person (name) (Hash/create :name name))`);
        });

        it("works a hash special form", () => {
          expect(lisp.evaluate(`(print (make-person "Adam"))`)).toEqual({
            type: "hash",
            value: new Map().set(":name", { type: "string", value: "Adam" }),
          });
        });
      });

      describe("when a special form is used", () => {
        beforeEach(() => {
          lisp.evaluate(`(defn make-person (name) #{ :name name })`);
        });

        it("works a hash special form", () => {
          expect(lisp.evaluate(`(print (make-person "Adam"))`)).toEqual({
            type: "hash",
            value: new Map().set(":name", { type: "string", value: "Adam" }),
          });
        });
      });
    });
  });

  describe("or special form", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should return false for empty or", () => {
      expect(lisp.evaluate("(or)")).toEqual(createBoolean(false));
    });

    it("should return single value for single argument", () => {
      expect(lisp.evaluate("(or 42)")).toEqual(createNumber(42));
      expect(lisp.evaluate("(or false)")).toEqual(createBoolean(false));
    });

    it("should return first truthy value encountered", () => {
      expect(lisp.evaluate("(or false 42 true)")).toEqual(createNumber(42));
    });

    it("should return false if all values are false", () => {
      expect(lisp.evaluate("(or false false false)")).toEqual(
        createBoolean(false),
      );
    });

    it("should short-circuit on first truthy value", () => {
      // Define a function that will throw if called
      lisp.evaluate(`
        (define will-error
          (lambda ()
            (/ 1 0)))
      `);

      // If or short-circuits correctly, will-error won't be called
      expect(lisp.evaluate("(or true (will-error))")).toEqual(
        createBoolean(true),
      );
    });

    it("should work with complex expressions", () => {
      expect(lisp.evaluate("(or (> 3 5) (< 2 4))")).toEqual(
        createBoolean(true),
      );
      expect(lisp.evaluate("(or (> 3 5) (> 2 4))")).toEqual(
        createBoolean(false),
      );
    });

    it("should work with mixed types", () => {
      expect(lisp.evaluate('(or false 0 "hello")')).toEqual(
        createNumber(0),
      );
    });

    it("should combine with and correctly", () => {
      expect(lisp.evaluate("(and (or false true) (or 1 2))"))
        .toEqual(createNumber(1));
    });
  });

  describe("Predicate Function Names", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    describe("when defining predicate functions", () => {
      it("should allow ? in function names", () => {
        // Define a simple predicate function
        lisp.evaluate(`
        (define even?
          (lambda (x)
            (if (= (Core/type? x) "number")
                (= (% x 2) 0)
                false)))
        `);

        // Test the predicate function
        expect(lisp.evaluate("(even? 2)")).toEqual(createBoolean(true));
        expect(lisp.evaluate("(even? 3)")).toEqual(createBoolean(false));
      });

      it("should allow complex predicate function composition", () => {
        // Define multiple predicate functions and compose them
        lisp.evaluate(`
          (define positive?
            (lambda (x)
              (if (= (Core/type? x) "number")
                  (> x 0)
                  false)))
        `);

        lisp.evaluate(`
          (define even?
            (lambda (x)
              (if (= (Core/type? x) "number")
                  (= (% x 2) 0)
                  false)))
        `);

        lisp.evaluate(`
          (define positive-and-even?
            (lambda (x)
              (if (positive? x)
                  (even? x)
                  false)))
        `);

        expect(lisp.evaluate("(positive-and-even? 2)")).toEqual(
          createBoolean(true),
        );
        expect(lisp.evaluate("(positive-and-even? 3)")).toEqual(
          createBoolean(false),
        );
        expect(lisp.evaluate("(positive-and-even? -2)")).toEqual(
          createBoolean(false),
        );
      });
    });
  });

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
        expect(lisp.evaluate("person")).toBeTruthy();
      });

      it("allows multiple key-value pairs", () => {
        lisp.evaluate(
          '(define person #{ :name "John" :age 30 :city "New York" })',
        );
        expect(lisp.evaluate("(Hash/get person :name)")).toEqual(
          createString("John"),
        );
        expect(lisp.evaluate("(Hash/get person :age)")).toEqual(
          createNumber(30),
        );
        expect(lisp.evaluate("(Hash/get person :city)")).toEqual(
          createString("New York"),
        );
      });

      it("returns null for non-existent keys", () => {
        lisp.evaluate('(define person #{ :name "John" })');
        expect(lisp.evaluate("(Hash/get person :unknown)")).toEqual(
          createNull(),
        );
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
        expect(lisp.evaluate("(Hash/get (Hash/get person :address) :city)"))
          .toEqual(createString("New York"));
      });
    });
  });

  describe("namespace", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should allow defining functions in namespaces", () => {
      lisp.evaluate(`
        (namespace Test
          (defn add (x y) (+ x y)))
      `);

      expect(lisp.evaluate("(Test/add 1 2)")).toEqual(createNumber(3));
    });

    describe("when ns is used", () => {
      it("works just the same", () => {
        lisp.evaluate(`
          (ns Test
            (defn add (x y) (+ x y)))
        `);

        expect(lisp.evaluate("(Test/add 1 2)")).toEqual(createNumber(3));
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
        lisp.evaluate("(List/head (List/create 1 2 3))"),
      ).toEqual(
        createNumber(1),
      );
    });

    it("should get the tail of a list", () => {
      expect(
        lisp.evaluate("(List/tail (List/create 1 2 3))"),
      ).toEqual(
        createList([createNumber(2), createNumber(3)]),
      );
    });

    it("should construct new lists with concat", () => {
      expect(
        lisp.evaluate("(List/concat 1 (List/create 2 3))"),
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
