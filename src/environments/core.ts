import { EnvironmentManager } from "../evaluator.ts";
import {
  createBoolean,
  createError,
  createFunction,
  createString,
  LispVal,
} from "../types.ts";
import { isError } from "../types.ts";

const testNull = createFunction((arg: LispVal): LispVal => {
  return createBoolean(arg.value === null);
});

const getType = createFunction((arg: LispVal): LispVal => {
  return createString(arg.type);
});

const testError = createFunction((arg: LispVal): LispVal => {
  return createBoolean(isError(arg));
});

const makeError = createFunction((arg: LispVal): LispVal => {
  return createError(arg.value as string);
});

export const define = (manager: EnvironmentManager) => {
  manager.create("Core");
  manager.extend("Core", (env) => env.set("null?", testNull));
  manager.extend("Core", (env) => env.set("type?", getType));
  manager.extend("Core", (env) => env.set("error?", testError));
  manager.extend("Core", (env) => env.set("error", makeError));
};
