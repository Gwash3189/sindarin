// parser.ts

import {
  createKeyword,
  createList,
  createNumber,
  createString,
  createSymbol,
  LispVal,
  ParseError,
  Token,
  TokenType,
} from "./types.ts";

export class Parser {
  private tokens: Token[];
  private position: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.position = 0;
  }

  private peek(): Token | null {
    return this.position < this.tokens.length
      ? this.tokens[this.position]
      : null;
  }

  private consume(): Token {
    if (this.position >= this.tokens.length) {
      throw new ParseError("Unexpected end of input");
    }
    return this.tokens[this.position++];
  }

  private parseAtom(token: Token): LispVal {
    switch (token.type) {
      case TokenType.NUMBER:
        return createNumber(token.value as number);

      case TokenType.STRING:
        return createString(token.value as string);

      case TokenType.SYMBOL:
        return createSymbol(token.value as string);

      case TokenType.KEYWORD:
        return createKeyword(token.value as string);

      default:
        throw new ParseError(`Unexpected token type: ${token.type}`);
    }
  }

  private parseList(): LispVal {
    // Consume the opening parenthesis
    this.consume();

    const elements: LispVal[] = [];

    while (this.peek() && this.peek()!.type !== TokenType.RIGHT_PAREN) {
      elements.push(this.parseExpression());
    }

    if (!this.peek()) {
      throw new ParseError("Unterminated list: missing closing parenthesis");
    }

    // Consume the closing parenthesis
    this.consume();

    return createList(elements);
  }

  private parseHashMap(): LispVal {
    // Skip the #{
    this.consume();

    const pairs: LispVal[] = [];

    while (this.peek() && this.peek()!.type !== TokenType.HASH_END) {
      // Parse key
      const key = this.parseExpression();
      if (!this.peek()) {
        throw new ParseError('Unexpected end of hash map');
      }

      // Parse value
      const value = this.parseExpression();

      // Add key and value directly, don't wrap in a list
      pairs.push(key, value);
    }

    if (!this.peek() || this.peek()!.type !== TokenType.HASH_END) {
      throw new ParseError('Unterminated hash map');
    }

    // Consume the }
    this.consume();

    return createList([
      createSymbol('make-hash'),
      createList([
        createSymbol('list'),
        ...pairs
      ])
    ]);
  }

  private parseQuoted(): LispVal {
    // Consume the quote
    this.consume();

    if (!this.peek()) {
      throw new ParseError("Unexpected end of input after quote");
    }

    const quoted = this.parseExpression();
    return createList([
      createSymbol("quote"),
      quoted,
    ]);
  }

  private parseExpression(): LispVal {
    const token = this.peek();

    if (!token) {
      throw new ParseError("Unexpected end of input");
    }

    switch (token.type) {
      case TokenType.LEFT_PAREN:
        return this.parseList();

      case TokenType.QUOTE:
        return this.parseQuoted();

      case TokenType.RIGHT_PAREN:
        throw new ParseError("Unexpected closing parenthesis");

      case TokenType.HASH_START:
        return this.parseHashMap();

      case TokenType.HASH_END:
        throw new ParseError("Unexpected }");

      default:
        return this.parseAtom(this.consume());
    }
  }

  parse(): LispVal {
    if (this.tokens.length === 0) {
      return createList([]); // Empty program is an empty list
    }

    const expressions: LispVal[] = [];

    while (this.position < this.tokens.length) {
      expressions.push(this.parseExpression());
    }

    // If there's only one expression, return it directly
    // Otherwise, wrap multiple expressions in a begin form
    return expressions.length === 1
      ? expressions[0]
      : createList([createSymbol("begin"), ...expressions]);
  }
}

// Convenience function for direct parsing
export function parse(tokens: Token[]): LispVal {
  const parser = new Parser(tokens);
  return parser.parse();
}

// Helper function to parse nested structures
export function parseNested(tokens: Token[]): LispVal[] {
  const parser = new Parser(tokens);
  const result = parser.parse();
  return result.type === "list" ? result.value as LispVal[] : [result];
}
