import { Sindarin } from "./mod.ts";
import { parseArgs } from "@std/cli";

function printHelp() {
  console.log(`
    Usage: sindarin [OPTIONS...] [PATH_TO_FILE]

    --help, -h    Show this help message
  `);
}

function main(): void {
  const args = parseArgs(Deno.args, {
    alias: {
      help: "h",
      test: "t",
    },
  });

  if (args.help) {
    printHelp();
    return Deno.exit(0);
  }

  let fileToParse = args._[0] as string;

  if (!args._[0]) {
    fileToParse = Deno.cwd() + "/main.sdr";
  }

  let fullPath: string;
  let contents: string;

  try {
    fullPath = Deno.realPathSync(fileToParse);
    contents = Deno.readTextFileSync(fullPath);
  } catch (_) {
    console.log(``);
    if (args.file) {
      console.log(`%cError:`, "color: red");
      console.log(`Could not read file ${fileToParse}`);
    } else {
      console.log(`%cError:`, "color: red");
      console.log(`Could not read file ${fileToParse}.`);
      console.log(``);
      console.log(`%cHelp Text:`, "color: blue");
      console.log(`Because you didn't provide a file to be evaluated`);
      console.log(
        `we looked for a file named main.sdr in the current`,
      );
      console.log(`directory but couldn't find it.`);
    }

    Deno.exit(1);
  }

  try {
    const result = new Sindarin().evaluate(contents);

    if (args.test || args.file?.includes("spec") || (args._[0] as string)?.includes("spec")) {
      return Deno.exit(0);
    }

    console.log(result.value);
    return Deno.exit(0);
  } catch (error) {
    console.error(error);
    Deno.exit(1);
  }
}

main();
