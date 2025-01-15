import { EnvironmentManager } from "../evaluator.ts";
import {
  createError,
  createFunction,
  createList,
  createNull,
  createNumber,
  isFunction,
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
    return createList([]);
  }
  return createList(elements.slice(1));
});

const concat = createFunction((head: LispVal, tail: LispVal): LispVal => {
  if (!isList(head) || !isList(tail)) {
    throw new EvalError("concat requires a list for both arguments");
  }
  return createList([
    ...(head.value as LispVal[]),
    ...(tail.value as LispVal[]),
  ]);
});

const sort = createFunction((list: LispVal, sorter: LispVal): LispVal => {
  if (isNull(list) || !isList(list)) {
    return createError("List/sort requires a list");
  }

  if (list.value.length === 0) {
    return list;
  }

  if (sorter !== undefined && (isNull(sorter) || !isFunction(sorter))) {
    return createError(
      "List/sort second parameter must be a function if it's provided",
    );
  }
  if (
    !isNumber(list.value[0] as LispVal<"number", number>) &&
    sorter === undefined
  ) {
    return createError(
      "List/sort requires a list of numbers when a sorter function is not provided",
    );
  }

  const lst = list.value as LispVal[];
  const func = sorter === undefined
    ? undefined
    : sorter.value as (a: LispVal, b: LispVal) => LispVal;

  return func === undefined
    ? createList(
      (lst as Array<LispVal<"number", number>>).sort((a, b) =>
        a.value - b.value
      ),
    )
    : createList(lst.sort((a, b) => func(a, b).value as number));
});

const push = createFunction((list: LispVal, value: LispVal): LispVal => {
  if (isNull(list) || !isList(list)) {
    return createError("List/push requires a list");
  }
  if (value === undefined) {
    return createError("List/value requires a second parameter");
  }

  const lst = list.value;

  lst.push(value);

  return createList(lst);
});

export const define = (manager: EnvironmentManager) => {
  manager.create("List");
  manager.extend("List", (env) => env.set("create", create));
  manager.extend("List", (env) => env.set("head", head));
  manager.extend("List", (env) => env.set("tail", tail));
  manager.extend("List", (env) => env.set("concat", concat));
  manager.extend("List", (env) => env.set("sort", sort));
  manager.extend(
    "List",
    (env) => env.evaluate(`(require "./src/environments/sdr/list.sdr")`),
  );
};
