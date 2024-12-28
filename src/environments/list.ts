import { EnvironmentManager } from "../evaluator.ts";
import { parse } from "../parser.ts";
import { tokenize } from "../tokeniser.ts";
import {
  createFunction,
  createNumber,
  createList,
  createNull,
  isLispVal,
  isList,
  isNull,
  isNumber,
  LispVal,
} from "../types.ts";

const create = createFunction((...args: LispVal[]): LispVal => {
  return createList(args);
});

const head = createFunction((list: LispVal): LispVal => {
  if (!isList(list)) {
    throw new EvalError("head requires a list");
  }
  const elements = list.value as LispVal[];
  return elements.length === 0 ? createNull() : elements[0];
});

const tail = createFunction((list: LispVal): LispVal => {
  if (!isList(list)) {
    throw new EvalError("tail requires a list");
  }
  const elements = list.value as LispVal[];
  if (elements.length === 0) {
    return createNull();
  }
  return createList(elements.slice(1));
});

const concat = createFunction((head: LispVal, tail: LispVal): LispVal => {
  if (!isList(tail)) {
    throw new EvalError("concat requires a list as its second argument");
  }
  return createList([head, ...(tail.value as LispVal[])]);
});

const element = createFunction((list: LispVal, index: LispVal): LispVal => {
  if (!isList(list)) {
    throw new EvalError("element requires a list as its first argument");
  }
  if (!isNumber(index)) {
    throw new EvalError("element requires a number as its second argument");
  }

  const elements = list.value as LispVal[];
  const i = index.value as number;

  if (i < 0 || i >= elements.length) {
    throw new EvalError("index out of range");
  }

  return elements[i];
});

const iterate = createFunction((list: LispVal, callback: LispVal): LispVal => {
  if (list === undefined || isNull(list)) {
    throw new EvalError('List/iterate first argument must not be null')
  }

  if (callback === undefined || isNull(callback)) {
    throw new EvalError('List.iterate second argument must be callback function')
  }

  const arr = list.value as Array<LispVal>
  const callbk = callback.value as (...args: LispVal[]) => void

  if (arr.length === 0) {
    return createNull();
  }

  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    callbk(createNumber(i), element)
  }

  return createNull();
})

export const define = (manager: EnvironmentManager) => {
  manager.create("List");
  manager.extend("List", (env) => env.set("create", create));
  manager.extend("List", (env) => env.set("head", head));
  manager.extend("List", (env) => env.set("tail", tail));
  manager.extend("List", (env) => env.set("concat", concat));
  manager.extend("List", (env) => env.set("element", element));
  manager.extend("List", (env) => env.set("iterate", iterate));
  manager.extend("List", (env) => env.set("each", iterate));
};
