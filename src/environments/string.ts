import { EnvironmentManager } from "../evaluator.ts";
import {
createError,
  createFunction,
  createList,
  createNull,
  createString,
  isNull,
  isString,
  LispVal,
} from "../types.ts";

const trim = createFunction((str: LispVal): LispVal => {
  if (str === undefined || !isString(str)) {
    throw createError("String/trim needs one argument that is a string");
  }

  return createString(str.value!.trim())
})

const split = createFunction((str: LispVal, by: LispVal): LispVal => {
  if (str === undefined || by === undefined) {
    throw new EvalError("String/split needs two arguments");
  }
  if (isNull(str)) return createList([]);
  if (!isString(str) || !isString(by)) {
    throw new EvalError("String/split requires string arguments");
  }

  const strValue = str.value as string;
  const byValue = by.value as string;

  if (strValue.length === 0) return createList([createString("")]);
  const result = strValue.split(byValue).map(createString);

  return createList(result);
});

const replace = createFunction((str: LispVal, pattern: LispVal, replacement: LispVal): LispVal => {
  if ((!isString(str) || isNull(str)) && (!isString(pattern) || isNull(pattern)) && (!isString(replacement) || isNull(replacement))) return createError(`String/replace three strings as arguments`)
  if (str === undefined || pattern === undefined || replacement === undefined) return createError(`String/trim requires three string arguments`)

  const replaceable = str.value as string
  const ptrn = pattern.value as string
  const toUse = replacement.value as string

  return createString(replaceable.replace(ptrn, toUse))
})

export const define = (manager: EnvironmentManager) => {
  manager.create("String");
  manager.extend("String", (env) => env.set("split", split));
  manager.extend("String", (env) => env.set("replace", replace));
  manager.extend("String", (env) => env.set("trim", trim));
};
