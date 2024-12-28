// main.ts
import { tokenize } from "./tokeniser.ts";
import { parse } from "./parser.ts";
import {
  createGlobalEnv,
  Environment,
  environments,
  evaluate,
} from "./evaluator.ts";
import { LispVal } from "./types.ts";

export class ParenSaurus {
  public env: Environment;

  constructor() {
    this.env = environments.get("global")!;
  }

  // Evaluates a string of Lisp code and returns the result
  evaluate(program: string): LispVal {
    const tokens = tokenize(program);
    const ast = parse(tokens);
    return evaluate(ast, this.env);
  }

  // Evaluates multiple expressions
  evaluateMultiple(programs: string[]): LispVal[] {
    return programs.map((program) => this.evaluate(program));
  }

  // Gets a value from the environment
  getEnvValue(name: string): LispVal {
    return this.env.get(name);
  }

  // Reset the environment
  resetEnv(): void {
    const env = createGlobalEnv();
    environments.set("global", env);
    this.env = env;
  }
}

// Example usage:
// const lisp = new ParenSaurus();
// const result = lisp.evaluate("(+ 1 2 3)");
