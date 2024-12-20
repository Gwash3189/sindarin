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
}

// Token interface for lexer output
interface Token {
  type: TokenType;
  value: string | number;
}

// Main Lisp value type
interface LispVal {
  type:
    | "number"
    | "string"
    | "boolean"
    | "function"
    | "list"
    | "export"
    | "keyword"
    | "symbol"
    | "null"
    | "hash";
  value:
    | number
    | string
    | boolean
    | LispFunction
    | LispVal[]
    | LispExport
    | LispHash
    | null;
}

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

const createFunction = (f: LispFunction): LispVal => ({
  type: "function",
  value: f,
});

const createExport = (e: LispExport): LispVal => ({
  type: "export",
  value: e,
});

const createKeyword = (k: string): LispVal => ({
  type: "keyword",
  value: k.startsWith(":") ? k : `:${k}`,
});

const createSymbol = (s: string): LispVal => ({
  type: "symbol",
  value: s,
});

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

const isBoolean = (
  v: LispVal,
): v is LispVal & { type: "boolean"; value: boolean } => v.type === "boolean";

const isList = (
  v: LispVal,
): v is LispVal & { type: "list"; value: LispVal[] } => v.type === "list";

const isFunction = (
  v: LispVal,
): v is LispVal & { type: "function"; value: LispFunction } =>
  v.type === "function";

const isKeyword = (
  v: LispVal,
): v is LispVal & { type: "keyword"; value: string } => v.type === "keyword";

const isSymbol = (
  v: LispVal,
): v is LispVal & { type: "symbol"; value: string } => v.type === "symbol";

const isNull = (v: LispVal): v is LispVal & { type: "null"; value: null } =>
  v.type === "null";

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
  createExport,
  createFunction,
  createHash,
  createKeyword,
  createList,
  createNull,
  createNumber,
  createString,
  createSymbol,
  EvalError,
  isBoolean,
  isFunction,
  isKeyword,
  isList,
  isNull,
  isNumber,
  isString,
  isSymbol,
  LispError,
  type LispExport,
  type LispFunction,
  type LispVal,
  ParseError,
  type Token,
  TokenType,
};
