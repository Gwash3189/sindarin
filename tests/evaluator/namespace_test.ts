import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { Sindarin } from "../../src/mod.ts";

describe("namespace", () => {
  describe("when a namespace is defined", () => {
    let lisp: Sindarin;

    beforeEach(() => {
      lisp = new Sindarin();
      lisp.evaluate(`
        (namespace Test
          (defn hello
            ()
            (inspect "Hello World")
          )
        )`);
    });

    it("exposes the bindings under that namespace", () => {
      expect(lisp.evaluate(`(inspect (Test/hello))`)).toEqual(
        lisp.evaluate(`"Hello World"`),
      );
    });

    describe("when a namespace is extended", () => {
      beforeEach(() => {
        lisp.evaluate(`
          (namespace Test
            (defn say-name
              (name)
              (print name)
            )
          )
        `);
      });

      it("extends the namespace and doesn't clobber the entire thing", () => {
        expect(lisp.evaluate(`(inspect (Test/say-name "Adam"))`)).toEqual(
          lisp.evaluate(`"Adam"`),
        );
        expect(lisp.evaluate(`(inspect (Test/hello))`)).toEqual(
          lisp.evaluate(`"Hello World"`),
        );
      });
    });
  });
});
