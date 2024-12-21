// lisp.ts

export type LispVal =
  | number
  | string
  | boolean
  | Symbol
  | LispList
  | LispFunc
  | LispMacro;

export type LispList = LispVal[];
export type LispFunc = (...args: LispVal[]) => LispVal;
export type LispMacro = {
  isMacro: true;
  call: (ast: LispList, env: Environment) => LispVal;
};

export class Symbol {
  constructor(public name: string) {}
}

export class Environment {
  private vars: Map<string, LispVal>;
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  set(name: string, value: LispVal): void {
    this.vars.set(name, value);
  }

  get(name: string): LispVal {
    if (this.vars.has(name)) {
      return this.vars.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }
}

// Core mathematical operations
const coreMathOps = {
  "+": (a: number, b: number): number => a + b,
  "-": (a: number, b: number): number => a - b,
  "*": (a: number, b: number): number => a * b,
  "/": (a: number, b: number): number => a / b,
  "%": (a: number, b: number): number => a % b,
};

// Core list operations
const coreListOps = {
  head: (list: LispList): LispVal => {
    if (list.length === 0) throw new Error("Cannot get head of empty list");
    return list[0];
  },
  tail: (list: LispList): LispList => {
    if (list.length === 0) throw new Error("Cannot get tail of empty list");
    return list.slice(1);
  },
  prepend: (item: LispVal, list: LispList): LispList => [item, ...list],
  list: (...items: LispVal[]): LispList => items,
  isEmpty: (list: LispList): boolean => list.length === 0,
};

export function evaluate(ast: LispVal, env: Environment): LispVal {
  if (
    typeof ast === "number" || typeof ast === "string" ||
    typeof ast === "boolean"
  ) {
    return ast;
  }
  if (ast instanceof Symbol) {
    return env.get(ast.name);
  }
  if (Array.isArray(ast)) {
    if (ast.length === 0) return [];
    const [first, ...rest] = ast;
    if (first instanceof Symbol) {
      const value = env.get(first.name);
      if (typeof value === "function") {
        const evaluatedArgs = rest.map((arg) => evaluate(arg, env));
        return (value as LispFunc)(...evaluatedArgs);
      } else if (isLispMacro(value)) {
        return evaluate(value.call(rest, env), env);
      }
    }
    return ast.map((item) => evaluate(item, env));
  }
  throw new Error(`Cannot evaluate: ${ast}`);
}

function isLispMacro(value: any): value is LispMacro {
  return typeof value === "object" && value !== null && "isMacro" in value &&
    value.isMacro === true;
}

export const globalEnv = new Environment();

// Add core operations to the global environment
Object.entries(coreMathOps).forEach(([name, func]) => {
  globalEnv.set(name, (...args: LispVal[]) => {
    if (args.some((arg) => typeof arg !== "number")) {
      throw new Error(`${name} only works with numbers`);
    }
    return args.reduce((a, b) => func(a as number, b as number));
  });
});

Object.entries(coreListOps).forEach(([name, func]) => {
  globalEnv.set(name, func as LispFunc);
});

// Define core macros
globalEnv.set("defmacro", {
  isMacro: true,
  call: (ast: LispList, env: Environment) => {
    const [symbol, params, body] = ast;
    if (!(symbol instanceof Symbol)) {
      throw new Error("Macro name must be a symbol");
    }
    env.set(symbol.name, {
      isMacro: true,
      call: (args: LispList, callEnv: Environment) => {
        const macroEnv = new Environment(env);
        const restParam = (params as Symbol[]).find((param) =>
          param.name.startsWith("...")
        );
        if (restParam) {
          const restIndex = (params as Symbol[]).indexOf(restParam);
          (params as Symbol[]).slice(0, restIndex).forEach((param, index) => {
            macroEnv.set(param.name, args[index]);
          });
          macroEnv.set(restParam.name.slice(3), args.slice(restIndex));
        } else {
          (params as Symbol[]).forEach((param, index) => {
            macroEnv.set(param.name, args[index]);
          });
        }
        return evaluate(body, macroEnv);
      },
    } as LispMacro);
    return name;
  },
} as LispMacro);

// Helper function to define functions in our Lisp-like language
globalEnv.set(
  "define",
  (symbol: Symbol, value: LispVal, env: Environment): LispVal => {
    if (!(symbol instanceof Symbol)) {
      throw new Error("First argument to define must be a symbol");
    }
    env.set(symbol.name, evaluate(value, env));
    return value;
  },
);

// Function definition using 'fn'
globalEnv.set("fn", (...args: LispVal[]): LispFunc => {
  const params = args.slice(0, -1) as Symbol[];
  const body = args[args.length - 1];
  return (...callArgs: LispVal[]): LispVal => {
    const fnEnv = new Environment(globalEnv);
    const restParam = params.find((param) => param.name.startsWith("..."));
    if (restParam) {
      const restIndex = params.indexOf(restParam);
      params.slice(0, restIndex).forEach((param, index) => {
        fnEnv.set(param.name, callArgs[index]);
      });
      fnEnv.set(restParam.name.slice(3), callArgs.slice(restIndex));
    } else {
      params.forEach((param, index) => {
        fnEnv.set(param.name, callArgs[index]);
      });
    }
    return evaluate(body, fnEnv);
  };
});
