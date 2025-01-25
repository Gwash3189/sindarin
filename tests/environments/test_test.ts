import { beforeEach, describe, it } from "@std/testing/bdd";
import { Sindarin } from "../../src/mod.ts";
import { createList, createString } from "../../src/types.ts";
import { expect } from "@std/expect/expect";

describe("Test", () => {
  let lisp: Sindarin;

  beforeEach(() => {
    lisp = new Sindarin();
  });

  describe("describe", () => {
    it("runs the provided function", () => {
      expect(lisp.evaluate(`(Test/describe "Test" (fn () true))`)).toEqual(
        lisp.evaluate(`true`),
      );
    });
  });

  describe("context", () => {
    it("runs the provided function", () => {
      expect(lisp.evaluate(`(Test/context "Test" (fn () true))`)).toEqual(
        lisp.evaluate(`true`),
      );
    });
  });

  describe("it", () => {
    it("runs the provided function", () => {
      expect(lisp.evaluate(`(Test/it "Test" (fn () true))`)).toEqual(
        lisp.evaluate(`true`),
      );
    });
  });

  describe("expect", () => {
    it("begins an expectation chain", () => {
      expect(lisp.evaluate(`
        (Test/expect
          "Test"
          (fn (hash)
            (Hash/get hash :actual)
          )
        )`)).toEqual(
          lisp.evaluate(`"Test"`),
        );
    });
  });

  describe("to-equal", () => {
    it("closes the expectation chain", () => {
      expect(lisp.evaluate(`
        ((Test/to-equal
          "Test"
        ) #{:actual "Test"})`)).toEqual(
          lisp.evaluate(`"  ✅"`),
        );
    });
  });

  describe("integration test", () => {
    it("runs a full test", () => {
      expect(lisp.evaluate(`
        (Test/describe "Test" (fn ()
          (Test/context "When we're testing the test module" (fn ()
            (Test/it "it should pass" (fn ()
              (Test/expect 1 (Test/to-equal 1))
            ))
          ))
        ))`)).toHaveProperty("value", expect.stringContaining("✅"));
    });
  });
});
