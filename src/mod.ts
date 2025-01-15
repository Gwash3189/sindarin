// main.ts
import { tokenize } from "./tokeniser.ts";
import { parse } from "./parser.ts";
import { environments, evaluate } from "./evaluator.ts";
import { LispVal } from "./types.ts";

export class Sindarin {
  private env() {
    return environments.get("global")!;
  }

  // Evaluates a string of Lisp code and returns the result
  evaluate(program: string): LispVal {
    return evaluate(parse(tokenize(program)), this.env());
  }

  // Reset the environment
  resetEnv(): void {
    environments.reset("global");
  }
}
