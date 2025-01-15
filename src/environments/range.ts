import { EnvironmentManager } from "../evaluator.ts";

export const define = (manager: EnvironmentManager) => {
  manager
    .create("Range");

  manager.extend(
    "Range",
    (env) => env.evaluate(`(require "./src/environments/sdr/range.sdr")`),
  );
};
