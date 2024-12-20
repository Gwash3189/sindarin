import {
  createBoolean,
  createFunction,
  createHash,
  createList,
  createNull,
  createNumber,
  createSymbol,
  EvalError,
  isBoolean,
  isFunction,
  isKeyword,
  isList,
  isNumber,
  isString,
  isSymbol,
  LispExport,
  LispFunction,
  LispVal,
} from "./types.ts";

// Environment class
export class Environment {
  private vars: Map<string, LispVal>;
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  get(name: string): LispVal {
    const symbol = this.vars.get(name);
    if (symbol !== undefined) {
      return symbol;
    }
    if (this.parent !== null) {
      return this.parent.get(name);
    }
    throw new EvalError(`Undefined symbol: ${name}`);
  }

  set(name: string, value: LispVal): LispVal {
    this.vars.set(name, value);
    return value;
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

          case "define":
            return this.evaluateDefine(rest, env);

          case "define-module":
            return this.evaluteDefineModule(rest, env);

          case "lambda":
            return this.evaluateLambda(rest, env);

          case "begin":
            return this.evaluateBegin(rest, env);

          case "let":
            return this.evaluateLet(rest, env);
        }
      }

      // Function application
      const evaledFirst = this.evaluate(first, env);
      if (!isFunction(evaledFirst)) {
        throw new EvalError(`${first.value} is not a function`);
      }

      const args = rest.map((arg) => this.evaluate(arg, env));
      return (evaledFirst.value as LispFunction)(...args);
    }

    throw new EvalError(`Cannot evaluate expression: ${JSON.stringify(exp)}`);
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

    return isBoolean(test) && test.value === false
      ? this.evaluate(alternative, env)
      : this.evaluate(consequent, env);
  }

  private evaluteDefineModule(args: LispVal[], env: Environment): LispVal {
    console.log(args)
    return createNull()
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

  private evaluateLambda(args: LispVal[], env: Environment): LispVal {
    if (args.length < 2) {
      throw new EvalError("Lambda requires at least two arguments");
    }

    const [params, ...body] = args;
    if (!isList(params) || !params.value.every(isSymbol)) {
      throw new EvalError("Lambda parameters must be a list of symbols");
    }

    const parameters = (params.value as LispVal[]).map(
      (p) => (p.value as string),
    );

    return createFunction((...args: LispVal[]): LispVal => {
      const localEnv = new Environment(env);
      parameters.forEach((param, i) => {
        localEnv.set(param, args[i] || createNull());
      });

      return body.reduce(
        (_, exp) => this.evaluate(exp, localEnv),
        createNull(),
      );
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

    const localEnv = new Environment(env);
    const bindingsList = bindings.value as LispVal[];

    // Process bindings
    for (const binding of bindingsList) {
      if (!isList(binding) || binding.value.length !== 2) {
        throw new EvalError("Each binding must be a list of two elements");
      }

      const [symbol, value] = binding.value as LispVal[];
      if (!isSymbol(symbol)) {
        throw new EvalError("Binding name must be a symbol");
      }

      localEnv.set(symbol.value as string, this.evaluate(value, env));
    }

    // Evaluate body in new environment
    return body.reduce((_, exp) => this.evaluate(exp, localEnv), createNull());
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
      if (!args.every(isNumber)) {
        throw new EvalError("= requires numbers");
      }
      if (args.length < 2) {
        throw new EvalError("= requires at least two arguments");
      }
      for (let i = 1; i < args.length; i++) {
        if ((args[i - 1].value as number) !== (args[i].value as number)) {
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
        throw new EvalError("> requires numbers");
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
        throw new EvalError("car requires a list");
      }
      const elements = list.value as LispVal[];
      if (elements.length === 0) {
        throw new EvalError("car: empty list");
      }
      return elements[0];
    }),
  );

  env.set(
    "tail",
    createFunction((list: LispVal): LispVal => {
      if (!isList(list)) {
        throw new EvalError("cdr requires a list");
      }
      const elements = list.value as LispVal[];
      if (elements.length === 0) {
        throw new EvalError("cdr: empty list");
      }
      return createList(elements.slice(1));
    }),
  );

  env.set(
    "cons",
    createFunction((head: LispVal, tail: LispVal): LispVal => {
      if (!isList(tail)) {
        throw new EvalError("cons requires a list as its second argument");
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
      return arg;
    }),
  );

  env.set('make-hash', createFunction((...args: LispVal[]): LispVal => {
    const hash = new Map<string, LispVal>();

    // args should be a single list containing pairs of key-value
    const pairs = args[0];
    if (!isList(pairs)) {
      throw new EvalError('make-hash requires a list of key-value pairs');
    }

    // Process pairs in twos
    const elements = pairs.value as LispVal[];
    for (let i = 0; i < elements.length; i += 2) {
      const key = elements[i];
      const value = elements[i + 1];

      if (!key || !value) {
        throw new EvalError('Hash requires an even number of key-value elements');
      }

      const keyStr = key.type === 'keyword' ? key.value as string : String(key.value);
      hash.set(keyStr, value);
    }

    return createHash(hash);
  }));

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

  // Add more arithmetic, comparison, and list operations...

  return env;
}

// Convenience function for evaluation
export function evaluate(exp: LispVal, env: Environment): LispVal {
  const evaluator = new Evaluator();
  return evaluator.evaluate(exp, env);
}
