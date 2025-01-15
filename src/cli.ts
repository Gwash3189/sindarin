import { Sindarin } from './mod.ts'
import { parseArgs} from "@std/cli";

function printHelp() {
  console.log(`Usage: sindarin [OPTIONS...]`)
  console.log(`\nRequired Flags:`)
  console.log(` --file      the file to evaluate`)
}

function main(): void {
  const args = parseArgs(Deno.args)
  if(args.help || args.h) {
    printHelp()
    return Deno.exit(0)
  }

  if (!args.file) {
    console.error('Provide a --file argument in order for the CLI to work')
    console.error('Example: sindarin --file=src/main.lisp')
    return Deno.exit(1)
  }

  const fullPath = Deno.realPathSync(args.file)
  const contents = Deno.readTextFileSync(fullPath)

  try {
    const result = new Sindarin().evaluate(contents)
    console.log(result.value)
    return Deno.exit(0)
  } catch (error) {
    console.error(error)
    Deno.exit(1)
  }
}

main()
