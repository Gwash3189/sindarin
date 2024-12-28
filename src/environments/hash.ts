import { EnvironmentManager } from "../evaluator.ts";
import {
  createFunction,
  createHash,
  createNull,
  isHash,
  isKeyword,
  LispVal,
} from "../types.ts";

const get = createFunction((hash: LispVal, key: LispVal): LispVal => {
  if (hash.type !== "hash") {
    throw new EvalError("First argument must be a hash");
  }
  const keyStr = key.type === "keyword"
    ? key.value as string
    : String(key.value);
  const value = (hash.value as Map<string, LispVal>).get(keyStr);
  return value ?? createNull();
});

const create = createFunction((...args: LispVal[]): LispVal => {
  const hash = new Map<string, LispVal>();

  if (args.length === 0) {
    return createHash(hash);
  }

  if (args.length < 2 || args.length % 2 !== 0) {
    throw new EvalError("Hash/create requires key value pairs");
  }

  // Process pairs in twos
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (!key || !value) {
      throw new EvalError(
        "Hash requires an even number of key-value elements",
      );
    }

    const keyStr = isKeyword(key) ? key.value as string : String(key.value);
    hash.set(keyStr, value);
  }

  return createHash(hash);
});

const set = createFunction(
  (hash: LispVal, key: LispVal, value: LispVal): LispVal => {
    if (hash === undefined || !isHash(hash)) {
      throw new EvalError("First argument must be a hash");
    }

    if (key === undefined) {
      throw new EvalError("Second argument must be a key");
    }
    const keyStr = isKeyword(key) ? key.value as string : String(key.value);
    (hash.value as Map<string, LispVal>).set(keyStr, value);

    return hash;
  },
);

export const define = (manager: EnvironmentManager) => {
  manager.create("Hash");
  manager.extend("Hash", (env) => env.set("get", get));
  manager.extend("Hash", (env) => env.set("create", create));
  manager.extend("Hash", (env) => env.set("set", set));
};
