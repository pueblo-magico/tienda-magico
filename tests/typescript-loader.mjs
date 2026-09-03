import { readFile } from "node:fs/promises";
import ts from "typescript";

const sourceRoot = new URL("../src/", import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return nextResolve(
      new URL(`${specifier.slice(2)}.ts`, sourceRoot).href,
      context,
    );
  }
  if (context.parentURL?.startsWith(sourceRoot) && specifier.startsWith(".")) {
    return nextResolve(
      new URL(`${specifier}.ts`, context.parentURL).href,
      context,
    );
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith(sourceRoot) && url.endsWith(".ts")) {
    const source = await readFile(new URL(url), "utf8");
    return {
      format: "module",
      shortCircuit: true,
      source: ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: new URL(url).pathname,
      }).outputText,
    };
  }
  return nextLoad(url, context);
}
