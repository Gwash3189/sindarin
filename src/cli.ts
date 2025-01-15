import { Sindarin } from './mod.ts'
import { parseArgs} from "@std/cli";

function printHelp() {
  console.log(`
    Usage: sindarin [OPTIONS...]

    --file, -f    Path to the file to be evaluated. When not provided, it will look for a file named main.sdr in the current directory.
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

  let fullPath: string
  let contents: string

  try {
    fullPath = Deno.realPathSync(fileToParse)
    contents = Deno.readTextFileSync(fullPath)
  } catch (_) {
    console.log(``)
    if (args.file) {
      console.log(`%cError:`, "color: red")
      console.log(`Could not read file ${fileToParse}`)
    } else {
      console.log(`%cError:`, "color: red")
      console.log(`Could not read file ${fileToParse}.`)
      console.log(``)
      console.log(`Help Text:
Because you didn't provide a file to be evaluated
we looked for a file named main.sdr in the current directory, but couldn't find it.
      `)
    }

    Deno.exit(1)
  }

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
