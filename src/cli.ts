import { Sindarin } from './mod.ts'
import { parseArgs} from "@std/cli";

function printHelp() {
  console.log(`
    Usage: sindarin [OPTIONS...]

    --file, -f    Path to the file to be evaluated
    --help, -h    Show this help message
  `
  )
}

function main(): void {
  let fileToParse: string

  const args = parseArgs(Deno.args, {
    alias: {
      help: 'h',
      file: 'f'
    }
  })

  if(args.help) {
    printHelp()
    return Deno.exit(0)
  }

  if (!args.file) {
    fileToParse = Deno.cwd() + '/main.sdr'
  } else {
    fileToParse = args.file
  }

  const fullPath = Deno.realPathSync(fileToParse)
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
