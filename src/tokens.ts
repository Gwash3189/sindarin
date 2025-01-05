import { Tokenizer } from "./tokeniser.ts";
import { SYMBOL_CHARS, Token, TokenType, TokenValues } from "./types.ts";

export class LeftParenToken implements Token {
  public readonly value = TokenValues.LEFT_PAREN;
  public readonly type = TokenType.LEFT_PAREN;

  public static test(char: string | null): boolean {
    return char === TokenValues.LEFT_PAREN;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(new LeftParenToken());
    tokenizer.advance();
  }
}

export class RightParenToken implements Token {
  public readonly value = TokenValues.RIGHT_PAREN;
  public readonly type = TokenType.RIGHT_PAREN;

  public static test(char: string | null): boolean {
    return char === TokenValues.RIGHT_PAREN;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(new RightParenToken());
    tokenizer.advance();
  }
}

export class SymbolToken implements Token {
  public readonly token = TokenValues.SYMBOL;
  public readonly type = TokenType.SYMBOL;
  public constructor(public readonly value: string) {}

  public static test(char: string | null): boolean {
    return TokenValues.SYMBOL.test(char ?? "");
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(tokenizer.readSymbol());
  }
}

export class KeywordToken implements Token {
  public readonly token = TokenValues.KEYWORD;
  public readonly type = TokenType.KEYWORD;
  public constructor(public readonly value: string) {}

  public static test(char: string | null): boolean {
    return char === TokenValues.KEYWORD;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(tokenizer.readKeyword());
  }
}

export class NumberToken implements Token {
  public readonly type = TokenType.NUMBER;
  public readonly value: number;

  public constructor(value: string) {
    this.value = Number(value);
  }

  public static test(char: string | null, peekedChat: string | null): boolean {
    return !!(/[0-9]/.test(char ?? "") ||
      (char === "-" && peekedChat && /[0-9]/.test(peekedChat!)));
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(tokenizer.readNumber());
  }
}

export class StringToken implements Token {
  public readonly token = TokenValues.STRING;
  public readonly type = TokenType.STRING;
  public constructor(public readonly value: string) {}

  public static test(char: string | null): boolean {
    return char === TokenValues.STRING;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(tokenizer.readString());
  }
}
export class QuoteToken implements Token {
  public readonly value = TokenValues.QUOTE;
  public readonly type = TokenType.QUOTE;

  public static test(char: string | null): boolean {
    return char === TokenValues.QUOTE;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(new QuoteToken());
    tokenizer.advance();
  }
}
export class HashStartToken implements Token {
  public readonly value = TokenValues.HASH_START;
  public readonly type = TokenType.HASH_START;

  public static test(char: string | null, peekedChar: string | null): boolean {
    return char === "#" && peekedChar === TokenValues.HASH_START;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(new HashStartToken());
    tokenizer.advance(2);
  }
}
export class HashEndToken implements Token {
  public readonly value = TokenValues.HASH_END;
  public readonly type = TokenType.HASH_END;

  public static test(char: string | null): boolean {
    return char === TokenValues.HASH_END;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(new HashEndToken());
    tokenizer.advance();
  }
}

export class WhiteSpaceToken {
  public static test(char: string | null): boolean {
    return /\s/.test(char ?? "");
  }

  public static execute(tokenizer: Tokenizer) {
    while (
      tokenizer.getCurrentChar() &&
      WhiteSpaceToken.test(tokenizer.getCurrentChar())
    ) {
      tokenizer.advance();
    }
  }
}

export class CommentToken {
  public readonly value = TokenValues.COMMENT;
  public readonly type = TokenType.COMMENT;
  private static readonly newLine = "\n";

  public static test(char: string | null): boolean {
    return char === TokenValues.COMMENT;
  }

  public static execute(tokenizer: Tokenizer) {
    while (
      tokenizer.getCurrentChar() !== null &&
      tokenizer.getCurrentChar() !== CommentToken.newLine
    ) {
      tokenizer.advance();
    }

    if (tokenizer.getCurrentChar() === "\n") {
      tokenizer.advance();
    }
  }
}

export class QuasiquoteToken implements Token {
  public readonly type = TokenType.QUASIQUOTE
  public readonly value = TokenValues.QUASIQUOTE

  public static test(char: string | null): boolean {
    return char === TokenValues.QUASIQUOTE
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(new QuasiquoteToken())
    tokenizer.advance()
  }
}
export class UnquoteSplicingToken implements Token {
  public readonly type = TokenType.UNQUOTE_SPLICING;
  public readonly value = TokenValues.UNQUOTE_SPLICING;
}

export class UnquoteToken implements Token {
  public readonly value = TokenValues.UNQUOTE;
  public readonly type = TokenType.UNQUOTE;

  public static test(char: string | null): boolean {
    return char === TokenValues.UNQUOTE;
  }

  public static execute(tokenizer: Tokenizer) {
    tokenizer.pushToken(new UnquoteToken());
    tokenizer.advance();

    // Check for @ following the comma
    if (tokenizer.getCurrentChar() === '@') {
      tokenizer.pushToken(new UnquoteSplicingToken());
      tokenizer.advance();
    }
  }
}
