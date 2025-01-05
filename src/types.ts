import { Environment } from "./evaluator.ts";

export const SYMBOL_CHARS = /[a-zA-Z0-9+\-*/<>=!?._\%]/;

// Token types for the lexer
enum TokenType {
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  SYMBOL = "SYMBOL",
  KEYWORD = "KEYWORD",
  NUMBER = "NUMBER",
  STRING = "STRING",
  QUOTE = "QUOTE",
  HASH_START = "HASH_START",
  HASH_END = "HASH_END",
  COMMENT = "COMMENT",
  QUASIQUOTE = "QUASIQUOTE",
  UNQUOTE = "UNQUOTE",
  UNQUOTE_SPLICING = "UNQUOTE_SPLICING"
}

export const TokenValues = {
  [TokenType.LEFT_PAREN]: "(",
  [TokenType.RIGHT_PAREN]: ")",
  [TokenType.QUOTE]: "'",
  [TokenType.HASH_START]: "{",
  [TokenType.HASH_END]: "}",
  [TokenType.SYMBOL]: SYMBOL_CHARS,
  [TokenType.KEYWORD]: ":",
  [TokenType.NUMBER]: "",
  [TokenType.STRING]: '"',
  [TokenType.COMMENT]: ";",
  [TokenType.QUASIQUOTE]: '`',
  [TokenType.UNQUOTE]: ',',
  [TokenType.UNQUOTE_SPLICING]: '@',
} as const;

// Token interface for lexer output
interface Token {
  type: TokenType;
  value: string | number;
}

// Main Lisp value type
export type LispType =
  | "number"
  | "string"
  | "boolean"
  | "function"
  | "list"
  | "export"
  | "keyword"
  | "symbol"
  | "null"
  | "error"
  | "macro"
  | "hash";

export type LispValue =
  | number
  | string
  | boolean
  | LispFunction
  | LispVal[]
  | LispExport
  | LispHash
  | MacroFunction
  | null;
interface LispVal<T = LispType, V = LispValue> {
  type: T;
  value: V;
}

// Function type
type MacroFunction = (args: LispVal[], env: Environment) => LispVal;

// Function type
type LispFunction = (...args: LispVal[]) => LispVal;

// Export record type for modules
type LispExport = Record<string, LispVal>;

// Export record type for modules
type LispHash = Map<string, LispVal>;

// Value creation helper functions
const createNumber = (n: number): LispVal => ({
  type: "number",
  value: n,
});

const createString = (s: string): LispVal => ({
  type: "string",
  value: s,
});

const createError = (s: string): LispVal => ({
  type: "error",
  value: s,
});

const createBoolean = (b: boolean): LispVal => ({
  type: "boolean",
  value: b,
});

const createHash = (h: LispHash): LispVal => ({
  type: "hash",
  value: h,
});

const createList = (l: LispVal[]): LispVal => ({
  type: "list",
  value: l,
});

const createMacro = (f: MacroFunction): LispVal => ({
  type: "macro",
  value: f,
});

const createFunction = (f: LispFunction): LispVal => ({
  type: "function",
  value: f,
});

const createKeyword = (k: string): LispVal => ({
  type: "keyword",
  value: k.startsWith(":") ? k : `:${k}`,
});

const createSymbol = (s: string): LispVal => ({
  type: "symbol",
  value: s,
});

export const createLambdaSymbol = (): LispVal => createSymbol("lambda");

const createNull = (): LispVal => ({
  type: "null",
  value: null,
});

// Type guard functions
const isNumber = (
  v: LispVal,
): v is LispVal & { type: "number"; value: number } => v.type === "number";

const isString = (
  v: LispVal,
): v is LispVal & { type: "string"; value: string } => v.type === "string";

const isError = (
  v: LispVal,
): v is LispVal & { type: "error"; value: string } => v.type === "error";

const isBoolean = (
  v: LispVal,
): v is LispVal & { type: "boolean"; value: boolean } => v.type === "boolean";

const isFalse = (
  v: LispVal,
): v is LispVal & { type: "boolean"; value: boolean } =>
  v.type === "boolean" && v.value === false;

const isTrue = (
  v: LispVal,
): v is LispVal & { type: "boolean"; value: boolean } =>
  v.type === "boolean" && v.value === true;

const isList = (
  v: LispVal,
): v is LispVal & { type: "list"; value: LispVal[] } => v.type === "list";

const isFunction = (
  v: LispVal,
): v is LispVal & { type: "function"; value: LispFunction } =>
  v.type === "function";

const isMacro = (
  v: LispVal,
): v is LispVal & { type: "macro"; value: LispFunction } =>
  v.type === "macro";

const isKeyword = (
  v: LispVal,
): v is LispVal & { type: "keyword"; value: string } => v.type === "keyword";

const isHash = (
  v: LispVal,
): v is LispVal & { type: "keyword"; value: string } => v.type === "hash";

const isSymbol = (
  v: LispVal,
): v is LispVal & { type: "symbol"; value: string } => v.type === "symbol";

const isNull = (v: LispVal): v is LispVal & { type: "null"; value: null } =>
  v.type === "null";

const isLispVal = (v: unknown): v is LispVal => {
  if (typeof v !== "object" || v === null) return false;
  const val = v as LispVal;
  return "type" in val && "value" in val;
};

// Error types
class LispError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LispError";
  }
}

class ParseError extends LispError {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

class EvalError extends LispError {
  constructor(message: string) {
    super(message);
    this.name = "EvalError";
  }
}

export {
  createBoolean,
  createError,
  createFunction,
  createHash,
  createKeyword,
  createList,
  createNull,
  createNumber,
  createString,
  createSymbol,
  createMacro,
  EvalError,
  isBoolean,
  isError,
  isFalse,
  isFunction,
  isMacro,
  isHash,
  isKeyword,
  isLispVal,
  isList,
  isNull,
  isNumber,
  isString,
  isSymbol,
  isTrue,
  LispError,
  type LispExport,
  type LispFunction,
  type MacroFunction,
  type LispVal,
  ParseError,
  type Token,
  TokenType,
};
