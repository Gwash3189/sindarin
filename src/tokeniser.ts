import { ParseError, Token, TokenType } from "./types.ts";

export class Tokenizer {
  private input: string;
  private position: number;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = this.input[0] || null;
  }

  private advance(count: number = 1): void {
    this.position += count;
    this.currentChar = this.position < this.input.length
      ? this.input[this.position]
      : null;
  }

  private skipWhitespace(): void {
    while (this.currentChar && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private readNumber(): Token {
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

    return {
      type: TokenType.NUMBER,
      value: Number(result),
    };
  }

  private readString(): Token {
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

    return {
      type: TokenType.STRING,
      value: result,
    };
  }

  private readKeyword(): Token {
    let result = ":";
    this.advance(); // Skip the initial colon

    while (
      this.currentChar && /[a-zA-Z0-9+\-*/<>=!._]/.test(this.currentChar)
    ) {
      result += this.currentChar;
      this.advance();
    }

    if (result.length === 1) {
      throw new ParseError("Invalid keyword: only contains colon");
    }

    return {
      type: TokenType.KEYWORD,
      value: result,
    };
  }

  private readSymbol(): Token {
    let result = "";

    while (
      this.currentChar && /[a-zA-Z0-9+\-*/<>=!._]/.test(this.currentChar)
    ) {
      result += this.currentChar;
      this.advance();
    }

    return {
      type: TokenType.SYMBOL,
      value: result,
    };
  }

  private peek(): string | null {
    return this.position + 1 < this.input.length
      ? this.input[this.position + 1]
      : null;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      // Skip whitespace
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      // Handle single-character tokens
      if (this.currentChar === "(") {
        tokens.push({ type: TokenType.LEFT_PAREN, value: "(" });
        this.advance();
        continue;
      }

      if (this.currentChar === ")") {
        tokens.push({ type: TokenType.RIGHT_PAREN, value: ")" });
        this.advance();
        continue;
      }

      if (this.currentChar === "'") {
        tokens.push({ type: TokenType.QUOTE, value: "'" });
        this.advance();
        continue;
      }

      // Handle numbers
      if (
        /[0-9]/.test(this.currentChar) ||
        (this.currentChar === "-" && this.peek() && /[0-9]/.test(this.peek()!))
      ) {
        tokens.push(this.readNumber());
        continue;
      }

      // Handle strings
      if (this.currentChar === '"') {
        tokens.push(this.readString());
        continue;
      }

      // Handle keywords
      if (this.currentChar === ":") {
        tokens.push(this.readKeyword());
        continue;
      }

      // Handle symbols
      if (/[a-zA-Z+\-*/<>=!?]/.test(this.currentChar)) {
        tokens.push(this.readSymbol());
        continue;
      }

      if (
        this.currentChar === "#" && (this.position + 1) < this.input.length &&
        this.input[this.position + 1] === "{"
      ) {
        tokens.push({ type: TokenType.HASH_START, value: "#{" });
        this.advance(2);
        continue;
      }

      if (this.currentChar === "}") {
        tokens.push({ type: TokenType.HASH_END, value: "}" });
        this.advance();
        continue;
      }

      throw new ParseError(`Unexpected character: ${this.currentChar}`);
    }

    return tokens;
  }
}

// Convenience function for one-off tokenization
export function tokenize(input: string): Token[] {
  const tokenizer = new Tokenizer(input);
  return tokenizer.tokenize();
}
