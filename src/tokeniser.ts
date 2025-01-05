import { ParseError, SYMBOL_CHARS, Token } from "./types.ts";

import {
  CommentToken,
  HashEndToken,
  HashStartToken,
  KeywordToken,
  LeftParenToken,
  NumberToken,
  QuasiquoteToken,
  QuoteToken,
  RightParenToken,
  StringToken,
  SymbolToken,
  UnquoteToken,
  WhiteSpaceToken,
} from "./tokens.ts";

export class Tokenizer {
  private input: string;
  private position: number;
  private currentChar: string | null;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = this.input[0] || null;
  }

  public getCurrentChar(): string | null {
    return this.currentChar;
  }

  public pushToken(token: Token) {
    this.tokens.push(token);
  }

  public advance(count: number = 1): void {
    this.position += count;
    this.currentChar = this.position < this.input.length
      ? this.input[this.position]
      : null;
  }

  public readNumber(): Token {
    let result = "";

    // Handle negative numbers
    if (this.currentChar === "-" && this.peek() && /[0-9]/.test(this.peek()!)) {
      result += "-";
      this.advance();
    }

    while (this.currentChar && /[0-9.]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    if (isNaN(Number(result))) {
      throw new ParseError(`Invalid number format: ${result}`);
    }

    return new NumberToken(result);
  }

  public readString(): Token {
    let result = "";
    // Skip the opening quote
    this.advance();

    while (this.currentChar && this.currentChar !== '"') {
      if (this.currentChar === "\\") {
        this.advance();
        if (!this.currentChar) {
          throw new ParseError("Unterminated string escape sequence");
        }
        switch (this.currentChar as string) {
          case "n":
            result += "\n";
            break;
          case "t":
            result += "\t";
            break;
          case "r":
            result += "\r";
            break;
          case '"':
            result += '"';
            break;
          case "\\":
            result += "\\";
            break;
          default:
            throw new ParseError(
              `Invalid escape sequence: \\${this.currentChar}`,
            );
        }
      } else {
        result += this.currentChar;
      }
      this.advance();
    }

    if (!this.currentChar) {
      throw new ParseError("Unterminated string literal");
    }

    // Skip the closing quote
    this.advance();

    return new StringToken(result);
  }

  public readKeyword(): Token {
    let result = ":";
    this.advance(); // Skip the initial colon

    while (this.currentChar && SYMBOL_CHARS.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    if (result.length === 1) {
      throw new ParseError("Invalid keyword: only contains colon");
    }

    return new KeywordToken(result);
  }

  public readSymbol(): Token {
    let result = "";

    while (this.currentChar && SYMBOL_CHARS.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    return new SymbolToken(result);
  }

  public peek(): string | null {
    return this.position + 1 < this.input.length
      ? this.input[this.position + 1]
      : null;
  }

  private flushTokens() {
    this.tokens = [];
  }

  tokenize(): Token[] {
    this.flushTokens();

    while (this.currentChar !== null) {
      if (WhiteSpaceToken.test(this.currentChar)) {
        WhiteSpaceToken.execute(this);
        continue;
      }

      if (CommentToken.test(this.currentChar)) {
        CommentToken.execute(this);
        continue;
      }

      // Handle single-character tokens
      if (LeftParenToken.test(this.currentChar)) {
        LeftParenToken.execute(this);
        continue;
      }

      if (RightParenToken.test(this.currentChar)) {
        RightParenToken.execute(this);
        continue;
      }

      if (QuoteToken.test(this.currentChar)) {
        QuoteToken.execute(this);
        continue;
      }

      // Handle numbers
      if (NumberToken.test(this.currentChar, this.peek())) {
        NumberToken.execute(this);
        continue;
      }

      // Handle strings
      if (StringToken.test(this.currentChar)) {
        StringToken.execute(this);
        continue;
      }

      if (KeywordToken.test(this.currentChar)) {
        KeywordToken.execute(this);
        continue;
      }

      if (SymbolToken.test(this.currentChar)) {
        SymbolToken.execute(this);
        continue;
      }

      if (HashStartToken.test(this.currentChar, this.peek())) {
        HashStartToken.execute(this);
        continue;
      }

      if (HashEndToken.test(this.currentChar)) {
        HashEndToken.execute(this);
        continue;
      }

      if (QuasiquoteToken.test(this.currentChar)) {
        QuasiquoteToken.execute(this);
        continue;
      }

      if (UnquoteToken.test(this.currentChar)) {
        UnquoteToken.execute(this);
        continue;
      }

      throw new ParseError(`Unexpected character: ${this.currentChar}`);
    }

    return this.tokens;
  }
}

// Convenience function for one-off tokenization
export function tokenize(input: string): Token[] {
  const tokenizer = new Tokenizer(input);
  return tokenizer.tokenize();
}
