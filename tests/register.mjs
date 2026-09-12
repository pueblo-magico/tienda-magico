import { register } from "node:module";

// Test-only loader: use the existing TypeScript compiler, with no runtime dependency.
register("./typescript-loader.mjs", import.meta.url);
