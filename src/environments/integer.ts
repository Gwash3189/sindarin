import { EnvironmentManager } from "../evaluator.ts";
import {
  createError,
  createFunction,
  createNumber,
  isNumber,
  isString,
  LispVal,
} from "../types.ts";

const parse = createFunction((str: LispVal): LispVal => {
  const err = createError(
    `Integer/parse: Provided value was not a number, it was a ${str.type}`,
  );

  if (!isString(str)) return err;
  const result = parseInt(str.value as string);

  if (isNaN(result)) return err;

  return createNumber(result);
});

const create = createFunction((x: LispVal): LispVal => {
  const err = createError(
    `Integer/create: Provided value was not a number, it was a ${x.type}`,
  );

  if (!isNumber(x)) return err;

  return createNumber(x.value as number);
});

export const define = (manager: EnvironmentManager) => {
  manager.create("Integer");
  manager.extend("Integer", (env) => env.set("parse", parse));
  manager.extend("Integer", (env) => env.set("create", create));
  manager.extend(
    "Integer",
    (env) => env.evaluate(`(require "./src/environments/lisp/integer.lisp")`),
  );
};
