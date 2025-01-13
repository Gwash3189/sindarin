import { EnvironmentManager } from "../evaluator.ts";

export const define = (manager: EnvironmentManager) => {
  manager
    .create("Boolean");

  manager.extend(
    "Boolean",
    (env) => env.evaluate(`(require "./src/environments/lisp/boolean.lisp")`),
  );
};
