import { parse, Parser } from "./parser.ts";
import { tokenize } from "./tokeniser.ts";
import {
  createBoolean,
  createFunction,
  createLambdaSymbol,
  createList,
  createNull,
  EvalError,
  isBoolean,
  isFunction,
  isHash,
  isKeyword,
  isList,
  isNull,
  isNumber,
  isString,
  isSymbol,
  LispFunction,
  LispVal,
  MacroFunction,
} from "./types.ts";

import * as Core from "./environments/core.ts";
import * as Hash from "./environments/hash.ts";
import * as List from "./environments/list.ts";
import * as String from "./environments/string.ts";
import * as File from "./environments/file.ts";
import * as Integer from "./environments/integer.ts";
import * as Boolean from "./environments/boolean.ts";
import * as Global from "./environments/global.ts";

// Environment class
export class Environment {
  private vars: Map<string, LispVal>;
  public parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  evaluate(lisp: string): LispVal {
    const tokens = tokenize(lisp);
    const ast = parse(tokens);
    return evaluate(ast, this);
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
}
export class EnvironmentManager {
  private environments: Map<string, Environment>;

  constructor() {
    this.environments = new Map<string, Environment>();
    this.environments.set("global", new Environment());
  }

  private findParent(name: string): Environment | null {
    const parts = EnvironmentManager.unfurl(name);
    const global = this.environments.get("global")!;

    if (parts.length === 1) {
      return global;
    }

    const parentName = parts.slice(0, -1);
    return this.dig(...parentName) || global;
  }

  extend(name: string, callback: (env: Environment) => void): void {
    const env = this.get(name);

    if (env === undefined) {
      throw new EvalError(`Environment ${name} not found`);
    }

    callback(env);
  }

  create(name: string): Environment {
    const parentEnv = this.findParent(name);
    const env = new Environment(parentEnv);

    this.environments.set(name, env);

    return env;
  }

  static unfurl(names: string): string[] {
    return names.split("/");
  }

  static furl(names: string[]): string {
    return names.join("/");
  }

  global() {
    return this.get("global")!;
  }

  dig(...names: string[]): Environment | undefined {
    let current = environments.get("global");

    for (const name of names) {
      if (current === undefined) {
        return undefined;
      }
      current = environments.get(name);
    }
    return current;
  }

  get(name: string): Environment | undefined {
    return this.environments.get(name);
  }

  set(name: string | string[], env: Environment = new Environment()): void {
    if (Array.isArray(name)) {
      name = EnvironmentManager.furl(name);
    }

    this.environments.set(name, env);
  }

  reset(name: string): void {
    this.environments.set(name, new Environment());
  }

  delete(name: string): boolean {
    return this.environments.delete(name);
  }

  has(name: string): boolean {
    return this.environments.has(name);
  }
}

export const environments = new EnvironmentManager();

// Evaluator class
export class Evaluator {
  evaluate(exp: LispVal, env: Environment): LispVal {
    // Handle primitives
    if (isNumber(exp) || isBoolean(exp) || isKeyword(exp) || isHash(exp)) {
      return exp;
    }

    // Handle strings and keywords
    if (isString(exp)) {
      return exp;
    }

    // Handle symbols
    if (isSymbol(exp)) {
      return this.evaluateSymbol(exp, env);
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
          case "if":
            return this.evaluateIf(rest, env);
          case "ns":
          case "namespace":
            return this.evaluateNamespace(rest, env);
          case "def":
          case "define":
            return this.evaluateDefine(rest, env);
          case "defn":
            return this.evaluateDefn(rest, env);
          case "fn":
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
        throw new EvalError(`
          ${JSON.stringify(first.value)} is not a function.
          item: ${JSON.stringify(proc)}
          code: ${JSON.stringify(exp)}
          env: ${JSON.stringify(env)}
        `);
      }

      const evaluatedArguments = [];
      for (const arg of rest) {
        evaluatedArguments.push(this.evaluate(arg, env));
      }
      // Apply function with evaluated arguments
      return (proc.value as LispFunction)(...evaluatedArguments);
    }

    throw new EvalError(`Cannot evaluate expression: ${JSON.stringify(exp)}`);
  }

  private evaluateSymbol(symbol: LispVal, env: Environment): LispVal {
    const symbolStr = symbol.value as string;

    // if symbol is "/" but only one character
    // this is for division of numbers
    // for example (/ 4 2)
    if (symbolStr.includes("/") && symbolStr.length > 1) {
      const parts = symbolStr.split("/");
      const ns = parts[parts.length - 2];
      const func = parts[parts.length - 1];
      const nsEnv = environments.dig(ns);
      if (!nsEnv) {
        throw new EvalError(`Namespace ${ns} not found`);
      }

      return nsEnv.get(func);
    }
    return env.get(symbolStr);
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
    if (args.length < 2) {
      throw new EvalError("If requires a minimum of 2 arguments");
    }

    const [condition, consequent, alternative] = args;
    const test = this.evaluate(condition, env);

    // In Lisp, only false & null are falsey, everything else is truthy
    const shouldTakeElse = (isBoolean(test) && test.value === false) ||
      isNull(test);

    if (alternative !== undefined) {
      return shouldTakeElse
        ? this.evaluate(alternative, env)
        : this.evaluate(consequent, env);
    }

    return this.evaluate(consequent, env);
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

  // In evaluator.ts, add apply to global environment and modify evaluateLambda to handle rest parameters
  private evaluateLambda(args: LispVal[], env: Environment): LispVal {
    if (args.length < 2) {
      throw new EvalError("Lambda requires at least two arguments");
    }

    const [params, ...body] = args;
    if (!isList(params) || !params.value.every(isSymbol)) {
      throw new EvalError("Lambda parameters must be a list of symbols");
    }

    const parameters = params.value as LispVal[];

    // Find rest parameter (if any)
    const restParamIndex = parameters.findIndex((p) =>
      isSymbol(p) && (p.value as string).startsWith("...")
    );

    // Validate rest parameter is last if present
    if (restParamIndex !== -1 && restParamIndex !== parameters.length - 1) {
      throw new EvalError("Rest parameter must be the last parameter");
    }

    // Create function that captures both the environment and body
    return createFunction((...funcArgs: LispVal[]): LispVal => {
      // Create new environment for function execution
      const localEnv = new Environment(env);

      // Handle regular parameters
      const regularParams = restParamIndex === -1
        ? parameters
        : parameters.slice(0, restParamIndex);

      for (let i = 0; i < regularParams.length; i++) {
        localEnv.set(
          regularParams[i].value as string,
          funcArgs[i] || createNull(),
        );
      }

      // Handle rest parameter if present
      if (restParamIndex !== -1) {
        const restParam = parameters[restParamIndex];
        const restParamName = (restParam.value as string).slice(3); // Remove "..." prefix
        const restArgs = funcArgs.slice(regularParams.length);
        localEnv.set(restParamName, createList(restArgs));
      }

      // Execute body expressions sequentially
      let result = createNull();
      for (const expr of body) {
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

  private evaluateNamespace(args: LispVal[], env: Environment): LispVal {
    if (args.length < 1) {
      throw new EvalError("Namespace requires a name");
    }

    const [name, ...body] = args;
    const ns = name.value as string;

    if (ns[0].toLowerCase() === ns[0]) {
      throw new EvalError(`Namespace ${ns} must start with uppercase`);
    }

    if (environments.has(ns) === false) {
      environments.create(ns);
    }

    const nsEnv = environments.get(ns)!;
    for (const exp of body) {
      this.evaluate(exp, nsEnv);
    }

    return createNull();
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

function setupNamespaces() {
  Global.define(environments);
  Core.define(environments);
  Hash.define(environments);
  List.define(environments);
  String.define(environments);
  File.define(environments);
  Integer.define(environments);
  Boolean.define(environments);
}

// Convenience function for evaluation
export function evaluate(exp: LispVal, env: Environment): LispVal {
  const evaluator = new Evaluator();
  return evaluator.evaluate(exp, env);
}

setupNamespaces();
