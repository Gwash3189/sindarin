// repl.ts
import { ParenSaurus } from "./mod.ts";
import { LispError } from "./types.ts";

export class REPL {
  private interpreter: ParenSaurus;
  private prompt = "parensaurus> ";

  constructor() {
    this.interpreter = new ParenSaurus();
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
      case ":quit":
      case ":q":
      case ":exit":
        console.log("Goodbye!");
        return true;

      case ":help":
        console.log(`
ParenSaurus REPL Commands:
  :help, :h            Show this help message
  :quit, :q, :exit     Exit the REPL
  :reset               Reset the environment
  :env                 Show defined variables
        `);
        return false;

      case ":reset":
        this.interpreter = new ParenSaurus();
        console.log("Environment reset.");
        return false;

      case ":env":
        // TODO: Implement environment inspection
        console.log(this.interpreter.env);
        return false;

      default:
        return false;
    }
  }

  public async start(): Promise<void> {
    console.log(`
ParenSaurus Lisp v0.1.0
Type :help for commands, :quit to exit
    `);

    while (true) {
      try {
        const input = await this.readLine();

        if (input.length === 0) continue;
        if (input.startsWith(":")) {
          if (this.handleSpecialCommands(input)) break;
          continue;
        }

        const result = this.interpreter.evaluate(input);
        this.printResult(result.value);
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
