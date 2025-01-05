// main.ts
import { tokenize } from "./tokeniser.ts";
import { parse } from "./parser.ts";
import { Environment, environments, evaluate } from "./evaluator.ts";
import { LispVal } from "./types.ts";

export class Sindarin {
  private env() {
    return environments.get("global")!;
  }

  // Evaluates a string of Lisp code and returns the result
  evaluate(program: string): LispVal {
    return evaluate(parse(tokenize(program)), this.env());
  }

  // Evaluates multiple expressions
  evaluateMultiple(programs: string[]): LispVal[] {
    return programs.map((program) => this.evaluate(program));
  }

  // Gets a value from the environment
  getEnvValue(name: string): LispVal {
    return this.env().get(name);
  }

  // Reset the environment
  resetEnv(): void {
    environments.reset("global");
  }
}

// Example usage:
// const lisp = new Sindarin();
// const result = lisp.evaluate("(+ 1 2 3)");
