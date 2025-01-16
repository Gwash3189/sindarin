import { EnvironmentManager } from "../evaluator.ts";

export const define = (manager: EnvironmentManager) => {
  manager
    .create("Test");

  manager.extend(
    "Test",
    (env) => env.evaluate(`(require "./src/environments/sdr/test.sdr")`),
  );
};
