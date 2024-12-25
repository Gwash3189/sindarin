import { LispFunc } from "./lisp.ts";
import { Parser } from "./parser.ts";
import { tokenize } from "./tokeniser.ts";
import {
  createBoolean,
  createError,
  createFunction,
  createHash,
  createLambdaSymbol,
  createList,
  createNull,
  createNumber,
  createString,
  createSymbol,
  EvalError,
  isBoolean,
  isError,
  isFunction,
  isKeyword,
  isList,
  isNumber,
  isString,
  isSymbol,
  LispExport,
  LispFunction,
  LispType,
  LispVal,
  LispValue,
} from "./types.ts";

// Environment class
export class Environment {
  private vars: Map<string, LispVal>;
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  get<T = LispVal>(name: string): T {
    let current: Environment | null = this;

    while (current !== null) {
      const value = current.vars.get(name);
      if (value !== undefined) {
        return value as T;
      }
      current = current.parent;
    }
    throw new EvalError(`Undefined symbol: ${name}`);
  }

  set(name: string, value: LispVal): LispVal {
    this.vars.set(name, value);
    return value;
  }

  has(name: string): boolean {
    return this.vars.has(name) ||
      (this.parent !== null && this.parent.has(name));
  }

  defineModule(name: string, exports: LispExport): void {
    this.vars.set(
      name,
      createList(
        Object.entries(exports).map(([key, value]) =>
          createList([createSymbol(key), value])
        ),
      ),
    );
  }
}

// Evaluator class
export class Evaluator {
  evaluate(exp: LispVal, env: Environment): LispVal {
    // Handle primitives
    if (isNumber(exp) || isBoolean(exp) || isKeyword(exp)) {
      return exp;
    }

    // Handle strings and keywords
    if (isString(exp)) {
      return exp;
    }

    // Handle symbols
    if (isSymbol(exp)) {
      return env.get(exp.value as string);
    }

    // Handle lists
    if (isList(exp)) {
      const elements = exp.value as LispVal[];
      if (elements.length === 0) {
        return createList([]);
      }

      const first = elements[0];
      const rest = elements.slice(1);

      // Handle special forms
      if (isSymbol(first)) {
        switch (first.value) {
          case "quote":
            return this.evaluateQuote(rest);
          case "if":
            return this.evaluateIf(rest, env);
          case "def":
          case "define":
            return this.evaluateDefine(rest, env);
          case "defn":
            return this.evaluateDefn(rest, env);
          case "lambda":
            return this.evaluateLambda(rest, env);
          case "begin":
            return this.evaluateBegin(rest, env);
          case "let":
            return this.evaluateLet(rest, env);
          case "and":
            return this.evaluateAnd(rest, env);
          case "or":
            return this.evaluateOr(rest, env);
          case "require":
            return this.evaluateRequire(rest, env);
        }
      }

      // Function application
      const proc = this.evaluate(first, env);
      if (!isFunction(proc)) {
        throw new EvalError(`${first.value} is not a function`);
      }

      const evaledArgs = [];
      for (const arg of rest) {
        evaledArgs.push(this.evaluate(arg, env));
      }

      // Apply function with evaluated arguments
      return (proc.value as LispFunction)(...evaledArgs);
    }

    throw new EvalError(`Cannot evaluate expression: ${JSON.stringify(exp)}`);
  }

  private evaluateRequire(args: LispVal[], env: Environment): LispVal {
    if (args.length !== 1) {
      throw new EvalError("Require requires exactly one argument");
    }

    const [module] = args;

    if (!isString(module)) {
      throw new EvalError("Require argument must be a string");
    }

    let source: string;

    try {
      source = Deno.readTextFileSync(module.value);
    } catch (error) {
      const err = error as Error;
      if (err instanceof Deno.errors.NotFound) {
        throw new EvalError(`Module not found: ${module.value}`);
      } else {
        throw new EvalError(`Error loading module:
${err.message}`);
      }
    }

    const tokens = tokenize(source);
    const parsed = new Parser(tokens).parse();
    return this.evaluate(parsed, env);
  }

  private evaluateQuote(args: LispVal[]): LispVal {
    if (args.length !== 1) {
      throw new EvalError("Quote requires exactly one argument");
    }
    return args[0];
  }

  private evaluateIf(args: LispVal[], env: Environment): LispVal {
    if (args.length !== 3) {
      throw new EvalError("If requires exactly three arguments");
    }

    const [condition, consequent, alternative] = args;
    const test = this.evaluate(condition, env);

    // In Lisp, only #f (false) is falsy, everything else is truthy
    const shouldTakeElse = isBoolean(test) && test.value === false;

    return shouldTakeElse
      ? this.evaluate(alternative, env)
      : this.evaluate(consequent, env);
  }

  private evaluteDefineModule(args: LispVal[], env: Environment): LispVal {
    return createNull();
  }

  private evaluateDefine(args: LispVal[], env: Environment): LispVal {
    if (args.length !== 2) {
      throw new EvalError("Define requires exactly two arguments");
    }

    const [symbol, value] = args;
    if (!isSymbol(symbol)) {
      throw new EvalError("First argument to define must be a symbol");
    }

    return env.set(symbol.value as string, this.evaluate(value, env));
  }

  private evaluateDefn(args: LispVal[], env: Environment): LispVal {
    const [name, params, body] = args;
    return this.evaluateDefine([
      name,
      createList([
        createLambdaSymbol(),
        params,
        body,
      ]),
    ], env);
  }

  private evaluateLambda(args: LispVal[], env: Environment): LispVal {
    if (args.length < 2) {
      throw new EvalError("Lambda requires at least two arguments");
    }

    const [params, ...body] = args;
    if (!isList(params) || !params.value.every(isSymbol)) {
      throw new EvalError("Lambda parameters must be a list of symbols");
    }

    const parameters = (params.value as LispVal[]).map((
      p,
    ) => (p.value as string));
    const bodyExpressions = body; // Capture body expressions

    // Create function that captures both the environment and body
    return createFunction((...funcArgs: LispVal[]): LispVal => {
      // Create new environment for function execution
      const localEnv = new Environment(env);

      // Bind parameters to arguments
      for (let i = 0; i < parameters.length; i++) {
        localEnv.set(parameters[i], funcArgs[i] || createNull());
      }

      // Execute body expressions sequentially
      let result = createNull();
      for (const expr of bodyExpressions) {
        result = this.evaluate(expr, localEnv);
      }
      return result;
    });
  }

  private evaluateBegin(args: LispVal[], env: Environment): LispVal {
    if (args.length === 0) {
      return createNull();
    }

    return args.reduce((_, exp) => this.evaluate(exp, env), createNull());
  }

  private evaluateLet(args: LispVal[], env: Environment): LispVal {
    if (args.length < 2) {
      throw new EvalError("Let requires at least two arguments");
    }

    const [bindings, ...body] = args;
    if (!isList(bindings)) {
      throw new EvalError("Let bindings must be a list");
    }

    // Create fresh environment for let
    const localEnv = new Environment(env);

    // Process bindings first, evaluating each value in the original environment
    const bindingsList = bindings.value as LispVal[];
    for (const binding of bindingsList) {
      if (!isList(binding) || binding.value.length !== 2) {
        throw new EvalError("Each binding must be a list of two elements");
      }

      const [symbol, value] = binding.value as LispVal[];
      if (!isSymbol(symbol)) {
        throw new EvalError("Binding name must be a symbol");
      }

      // Evaluate value in original environment and set in new environment
      const evaluatedValue = this.evaluate(value, env);
      localEnv.set(symbol.value as string, evaluatedValue);
    }

    // Finally evaluate body in the new environment
    let result = createNull();
    for (const expr of body) {
      result = this.evaluate(expr, localEnv);
    }

    return result;
  }

  private evaluateAnd(args: LispVal[], env: Environment): LispVal {
    if (args.length === 0) {
      return createBoolean(true); // Empty and is true, following Lisp convention
    }

    for (let i = 0; i < args.length; i++) {
      const result = this.evaluate(args[i], env);
      // In Lisp, typically only false/nil is falsy, everything else is truthy
      if (isBoolean(result) && result.value === false) {
        return createBoolean(false);
      }
      // If this is the last value and we haven't returned false, return the actual value
      if (i === args.length - 1) {
        return result;
      }
    }

    return createBoolean(true);
  }

  private evaluateOr(args: LispVal[], env: Environment): LispVal {
    if (args.length === 0) {
      return createBoolean(false); // Empty or is false, following Lisp convention
    }

    for (let i = 0; i < args.length; i++) {
      const result = this.evaluate(args[i], env);
      // In Lisp, only false/nil is falsy, so any non-false value should trigger short-circuit
      if (!isBoolean(result) || result.value === true) {
        return result; // Return the actual truthy value, not just true
      }
      // If this is the last value and we haven't found a truthy value, return it
      if (i === args.length - 1) {
        return result;
      }
    }

    return createBoolean(false);
  }
}

// Create initial environment with basic operations
export function createGlobalEnv(): Environment {
  const env = new Environment();

  // Arithmetic operations
  env.set(
    "+",
    createFunction((...args: LispVal[]): LispVal => {
      if (!args.every(isNumber)) {
        throw new EvalError("+ requires numbers");
      }
      return createNumber(
        args.reduce((sum, n) => sum + (n.value as number), 0),
      );
    }),
  );

  env.set(
    "%",
    createFunction((...args: LispVal[]): LispVal => {
      if (!args.every(isNumber)) {
        throw new EvalError("% requires numbers");
      }
      if (args.length !== 2) {
        throw new EvalError("% requires exactly two arguments");
      }
      if (args[1].value === 0) {
        throw new EvalError("modulo by zero error");
      }
      return createNumber(
        (args[0].value as number) % (args[1].value as number),
      );
    }),
  );

  env.set(
    "-",
    createFunction((...args: LispVal[]): LispVal => {
      if (!args.every(isNumber)) {
        throw new EvalError("- requires numbers");
      }
      if (args.length === 0) {
        throw new EvalError("- requires at least one argument");
      }
      if (args.length === 1) return createNumber(-(args[0].value as number));
      return createNumber(
        args.slice(1).reduce(
          (diff, n) => diff - (n.value as number),
          args[0].value as number,
        ),
      );
    }),
  );

  env.set(
    "*",
    createFunction((...args: LispVal[]): LispVal => {
      if (!args.every(isNumber)) {
        throw new EvalError("* requires numbers");
      }
      return createNumber(
        args.reduce((prod, n) => prod * (n.value as number), 1),
      );
    }),
  );

  env.set(
    "/",
    createFunction((...args: LispVal[]): LispVal => {
      if (!args.every(isNumber)) {
        throw new EvalError("/ requires numbers");
      }
      if (args.length === 0) {
        throw new EvalError("/ requires at least one argument");
      }
      if (args.length === 1) {
        return createNumber(1 / (args[0].value as number));
      }
      if (args.some((value) => value.value === 0)) {
        throw new EvalError("division by zero error");
      }

      return createNumber(
        args.slice(1).reduce(
          (quotient, n) => quotient / (n.value as number),
          args[0].value as number,
        ),
      );
    }),
  );

  // Comparison operations
  env.set(
    "=",
    createFunction((...args: LispVal[]): LispVal => {
      if (args.length < 2) {
        throw new EvalError("= requires at least two arguments");
      }

      // Check if all arguments
      for (let i = 1; i < args.length; i++) {
        if ((args[i - 1].value) !== (args[i].value)) {
          return createBoolean(false);
        }
      }
      return createBoolean(true);
    }),
  );

  env.set(
    ">",
    createFunction((...args: LispVal[]): LispVal => {
      if (!args.every(isNumber)) {
        return createBoolean(false);
      }
      if (args.length < 2) {
        throw new EvalError("> requires at least two arguments");
      }
      for (let i = 1; i < args.length; i++) {
        if ((args[i - 1].value as number) <= (args[i].value as number)) {
          return createBoolean(false);
        }
      }
      return createBoolean(true);
    }),
  );

  env.set(
    "<",
    createFunction((...args: LispVal[]): LispVal => {
      if (!args.every(isNumber)) {
        throw new EvalError("< requires numbers");
      }
      if (args.length < 2) {
        throw new EvalError("< requires at least two arguments");
      }
      for (let i = 1; i < args.length; i++) {
        if ((args[i - 1].value as number) >= (args[i].value as number)) {
          return createBoolean(false);
        }
      }
      return createBoolean(true);
    }),
  );

  // List operations
  env.set(
    "list",
    createFunction((...args: LispVal[]): LispVal => {
      return createList(args);
    }),
  );

  env.set(
    "head",
    createFunction((list: LispVal): LispVal => {
      if (!isList(list)) {
        throw new EvalError("head requires a list");
      }
      const elements = list.value as LispVal[];
      return elements.length === 0 ? createNull() : elements[0];
    }),
  );

  env.set(
    "tail",
    createFunction((list: LispVal): LispVal => {
      if (!isList(list)) {
        throw new EvalError("tail requires a list");
      }
      const elements = list.value as LispVal[];
      if (elements.length === 0) {
        return createNull();
      }
      return createList(elements.slice(1));
    }),
  );

  env.set(
    "concat",
    createFunction((head: LispVal, tail: LispVal): LispVal => {
      if (!isList(tail)) {
        throw new EvalError("concat requires a list as its second argument");
      }
      return createList([head, ...(tail.value as LispVal[])]);
    }),
  );

  // Add null handling
  env.set(
    "null?",
    createFunction((arg: LispVal): LispVal => {
      return createBoolean(arg.value === null);
    }),
  );

  env.set("null", createNull());

  env.set(
    "inspect",
    createFunction((arg: LispVal): LispVal => {
      return arg;
    }),
  );

  env.set(
    "print",
    createFunction((arg: LispVal): LispVal => {
      return env.get<LispVal<LispType, LispFunction>>("inspect").value(arg);
    }),
  );

  env.set(
    "not",
    createFunction((arg: LispVal): LispVal => {
      if (isBoolean(arg)) {
        return createBoolean(!arg.value);
      }
      return createBoolean(false);
    }),
  );

  env.set(
    "make-hash",
    createFunction((...args: LispVal[]): LispVal => {
      const hash = new Map<string, LispVal>();
      const pairs = args[0];
      if (!isList(pairs)) {
        throw new EvalError("make-hash requires a list of key-value pairs");
      }

      // Process pairs in twos
      const elements = pairs.value as LispVal[];
      for (let i = 0; i < elements.length; i += 2) {
        const key = elements[i];
        const value = elements[i + 1];

        if (!key || !value) {
          throw new EvalError(
            "Hash requires an even number of key-value elements",
          );
        }

        const keyStr = key.type === "keyword"
          ? key.value as string
          : String(key.value);
        hash.set(keyStr, value);
      }

      return createHash(hash);
    }),
  );

  // Add hash accessor functions too
  env.set(
    "hash-get",
    createFunction((hash: LispVal, key: LispVal): LispVal => {
      if (hash.type !== "hash") {
        throw new EvalError("First argument must be a hash");
      }
      const keyStr = key.type === "keyword"
        ? key.value as string
        : String(key.value);
      const value = (hash.value as Map<string, LispVal>).get(keyStr);
      return value ?? createNull();
    }),
  );

  env.set("true", createBoolean(true));
  env.set("false", createBoolean(false));
  env.set(
    "type?",
    createFunction((arg: LispVal): LispVal => {
      return createString(arg.type);
    }),
  );
  env.set(
    "error",
    createFunction((arg: LispVal): LispVal => {
      return createError(arg.value as string);
    }),
  );
  env.set(
    "error?",
    createFunction((arg: LispVal): LispVal => {
      return createBoolean(isError(arg));
    }),
  );
  env.set(
    "js-eval",
    createFunction((arg: LispVal): LispVal => {
      function deserialize(value: any): any {
        switch (typeof value) {
          case "number":
            return createNumber(value);
          case "string":
            return createString(value);
          case "boolean":
            return createBoolean(value);
          case "object":
            if (Array.isArray(value)) {
              return createList(value.map(deserialize));
            } else {
              const hash = value.value as Map<string, LispVal>;
              const obj: Record<string, any> = {};
              for (const [key, val] of hash.entries()) {
                obj[key] = deserialize(val);
              }
              return obj;
            }
          default:
            return null;
        }
      }
      try {
        const value = eval(arg.value as string);
        return deserialize(value);
      } catch (error) {
        console.log(error);
        const err = error as Error;
        return createError(err.message);
      }
    }),
  );
  // Add more arithmetic, comparison, and list operations...

  return env;
}

// Convenience function for evaluation
export function evaluate(exp: LispVal, env: Environment): LispVal {
  const evaluator = new Evaluator();
  return evaluator.evaluate(exp, env);
}
