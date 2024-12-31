import { EnvironmentManager } from "../evaluator.ts";
import {
  createError,
  createFunction,
  createString,
  isNull,
  isString,
  LispVal,
} from "../types.ts";

const readTextFile = createFunction((path: LispVal): LispVal => {
  if (path === undefined) {
    return createError("File/read-text-file requires a path argument");
  }
  if (isNull(path)) {
    return createError("File/read-text-file path argument can't be null");
  }
  if (!isString(path)) {
    return createError("File/read-text-file path argument must be a string");
  }

  const pth = path.value as string;
  const contents = Deno.readTextFileSync(pth);

  return createString(contents);
});

export const define = (manager: EnvironmentManager) => {
  manager.create("File");
  manager.extend("File", (env) => env.set("read-text-file", readTextFile));
};
