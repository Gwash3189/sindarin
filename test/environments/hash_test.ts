import { beforeEach, describe, it } from "@std/testing/bdd";
import { ParenSaurus } from "../../src/mod.ts";
import {
  createHash,
  createNull,
  createNumber,
  createString,
} from "../../src/types.ts";
import { expect } from "@std/expect/expect";

describe("Hash", () => {
  describe("set", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("should set a value in a hash", () => {
      lisp.evaluate("(define person (Hash/create))");

      expect(lisp.evaluate('(Hash/set person :name "John")')).toEqual(
        createHash(new Map().set(":name", createString("John"))),
      );
    });
  });

  describe("get", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("gets a value from a hash", () => {
      lisp.evaluate('(define person (Hash/create :name "John"))');

      expect(lisp.evaluate("(Hash/get person :name)")).toEqual(
        createString("John"),
      );
    });

    it("returns null for missing keys", () => {
      lisp.evaluate('(define person (Hash/create :name "John"))');

      expect(lisp.evaluate("(Hash/get person :age)")).toEqual(createNull());
    });
  });

  describe("create", () => {
    let lisp: ParenSaurus;

    beforeEach(() => {
      lisp = new ParenSaurus();
    });

    it("creates a hash", () => {
      expect(lisp.evaluate("(Hash/create)")).toEqual(createHash(new Map()));
    });

    it("creates a hash with key-value pairs", () => {
      expect(
        lisp.evaluate('(Hash/create :name "John" :age 30)'),
      ).toEqual(
        createHash(
          new Map().set(":name", createString("John")).set(
            ":age",
            createNumber(30),
          ),
        ),
      );
    });

    it("throws an error for odd number of arguments", () => {
      expect(() => lisp.evaluate('(Hash/create :name "John" :age)'))
        .toThrow("Hash/create requires key value pairs");
    });
  });
});
