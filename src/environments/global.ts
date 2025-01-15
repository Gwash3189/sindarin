import { EnvironmentManager } from "../evaluator.ts";
import {
  createBoolean,
  createError,
  createFunction,
  createList,
  createNull,
  createNumber,
  createString,
  isBoolean,
  isNumber,
  LispError,
  LispVal,
} from "../types.ts";

const addition = createFunction((...args: LispVal[]): LispVal => {
  if (!args.every(isNumber)) {
    throw new EvalError("+ requires numbers");
  }
  return createNumber(
    args.reduce((sum, n) => sum + (n.value as number), 0),
  );
});

const modulo = createFunction((...args: LispVal[]): LispVal => {
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
});

const minus = createFunction((...args: LispVal[]): LispVal => {
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
});

const multiply = createFunction((...args: LispVal[]): LispVal => {
  if (!args.every(isNumber)) {
    throw new EvalError("* requires numbers");
  }
  return createNumber(
    args.reduce((prod, n) => prod * (n.value as number), 1),
  );
});

const divide = createFunction((...args: LispVal[]): LispVal => {
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
});

const equals = createFunction((...args: LispVal[]): LispVal => {
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
});

const greaterThan = createFunction((...args: LispVal[]): LispVal => {
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
});

const lessThan = createFunction((...args: LispVal[]): LispVal => {
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
});

const makeNull = createNull();

const exit = createFunction((message: LispVal): LispVal => {
  throw new LispError(message.value as string);
});

const inspect = createFunction((arg: LispVal): LispVal => {
  console.log(arg);
  return arg;
});

const print = createFunction((arg: LispVal): LispVal => {
  console.log(arg);
  return arg;
});

const pp = createFunction((arg: LispVal): LispVal => {
  console.log(arg.value);
  return arg;
});

const not = createFunction((arg: LispVal): LispVal => {
  if (isBoolean(arg)) {
    return createBoolean(!arg.value);
  }
  return createBoolean(false);
});

const tru = createBoolean(true);

const fls = createBoolean(false);

const jsEval = createFunction((arg: LispVal): LispVal => {
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
          const obj: Record<string, unknown> = {};
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
    const err = error as Error;
    return createError(err.message);
  }
});

const explore = (manager: EnvironmentManager) =>
  createFunction((name: LispVal) => {
    const ns = manager.get(name.value as string);
    if (ns === undefined) {
      return createError(`No namespace by the name ${name.value}`);
    }
    (print.value as (x: unknown) => void)(ns["vars"]);
    return createNull();
  });

const execPath = createString(Deno.execPath());

export const define = (manager: EnvironmentManager) => {
  manager.create("global");
  manager.extend("global", (env) => env.set("explore", explore(manager)));
  manager.extend("global", (env) => env.set("+", addition));
  manager.extend("global", (env) => env.set("%", modulo));
  manager.extend("global", (env) => env.set("-", minus));
  manager.extend("global", (env) => env.set("*", multiply));
  manager.extend("global", (env) => env.set("/", divide));
  manager.extend("global", (env) => env.set("=", equals));
  manager.extend("global", (env) => env.set(">", greaterThan));
  manager.extend("global", (env) => env.set("<", lessThan));
  manager.extend("global", (env) => env.set("null", makeNull));
  manager.extend("global", (env) => env.set("inspect", inspect));
  manager.extend("global", (env) => env.set("print", print));
  manager.extend("global", (env) => env.set("pp", pp));
  manager.extend("global", (env) => env.set("not", not));
  manager.extend("global", (env) => env.set("true", tru));
  manager.extend("global", (env) => env.set("false", fls));
  manager.extend("global", (env) => env.set("js-eval", jsEval));
  manager.extend("global", (env) => env.set("exec-path", execPath));
  manager.extend("global", (env) => env.set("exit", exit));
  manager.extend(
    "global",
    (env) => env.evaluate(`(require "./src/environments/lisp/global.lisp")`),
  );
};
