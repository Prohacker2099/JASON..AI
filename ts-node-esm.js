// This file helps ts-node load TypeScript files as ES modules
import { register } from "ts-node";

register({
  esm: true,
  transpileOnly: true,
  moduleTypes: {
    "**/*.ts": "esm",
  },
});
