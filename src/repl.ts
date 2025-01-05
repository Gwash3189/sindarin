// repl.ts
import { environments } from "./evaluator.ts";
import { Sindarin } from "./mod.ts";
import { TokenValues } from "./types.ts";
import { LispError, TokenType } from "./types.ts";

export class REPL {
  private interpreter: Sindarin;
  private prompt = "sindarin> ";
  private counter = {open: 0, close: 0}
  private input = ""
  DEFAULT_PROMPT = "sindarin> "
  OPEN_PAREN_PROMPT = "sindarin>* "

  constructor() {
    this.interpreter = new Sindarin();
  }

  private async readLine(): Promise<string> {
    const buf = new Uint8Array(1024);
    await Deno.stdout.write(new TextEncoder().encode(this.prompt));
    const n = await Deno.stdin.read(buf);
    if (n === null) return "";
    return new TextDecoder().decode(buf.subarray(0, n)).trim();
  }

  private printResult(result: unknown): void {
    switch (typeof result) {
      case "string": {
        console.log("=>", `"${result}"`);
        break;
      }
      default:
        console.log("=>", result);
        break;
    }
  }

  private printError(error: Error): void {
    console.error("Error:", error.message);
  }

  private handleSpecialCommands(input: string): boolean {
    switch (input.toLowerCase()) {
      case ":inspect-repl":
        console.log(JSON.stringify(this, null, 2))
        return false
      case ":quit":
      case ":q":
      case ":exit":
        console.log("Goodbye!");
        return true;

      case ":help":
        console.log(`
Sindarin REPL Commands:
  :help, :h            Show this help message
  :quit, :q, :exit     Exit the REPL
  :reset               Reset the environment
  :env                 Show defined variables
        `);
        return false;

      case ":reset": {
        this.interpreter.resetEnv();
        console.log("Environment reset.");
        return false;
      }

      case ":reload":
        console.log("Reloading...");
        return Deno.exit(5);

      case ":env":
        console.log(environments);
        return false;

      default:
        return false;
    }
  }

  public async start(): Promise<void> {
    console.log(`
Sindarin Lisp v0.1.0
Type :help for commands, :quit to exit
    `);

    while (true) {
      try {
        let input = await this.readLine();

        if (this.counter.open > 0) input = " " + input

        if (input.length === 0) continue;
        if (input.startsWith(":")) {
          if (this.handleSpecialCommands(input)) break;
          continue;
        }

        this.counter = input.split('').reduce((acc, char) => {
          if (char === TokenValues[TokenType.LEFT_PAREN]) {
            acc.open = acc.open + 1
          }

          if (char === TokenValues[TokenType.RIGHT_PAREN]) {
            acc.close = acc.close + 1
          }

          return acc
        }, this.counter)

        if (this.counter.open !== this.counter.close) {
          if (!this.prompt.includes('*')) {
            this.prompt = this.OPEN_PAREN_PROMPT
          }
          this.input = this.input + input
          continue;
        }

        if (this.counter.open === this.counter.close) {
          const result = this.interpreter.evaluate(this.input + input);
          this.prompt = this.DEFAULT_PROMPT
          this.printResult(result.value);
          this.counter = {open: 0, close: 0}
          this.input = ""
        }


      } catch (error) {
        if (error instanceof LispError) {
          this.printError(error);
        } else {
          throw error; // Rethrow unexpected errors
        }
      }
    }
  }
}

// Start REPL if this file is run directly
if (import.meta.main) {
  const repl = new REPL();
  await repl.start();
}
