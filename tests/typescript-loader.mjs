import { access, readFile } from "node:fs/promises";
import ts from "typescript";

const sourceRoot = new URL("../src/", import.meta.url).href;
const cmsRoot = new URL("../apps/cms/src/", import.meta.url).href;

async function resolveTypeScriptModule(baseUrl, context, nextResolve) {
  for (const extension of [".ts", ".tsx"]) {
    const candidate = `${baseUrl}${extension}`;
    try {
      await access(new URL(candidate));
      return nextResolve(candidate, context);
    } catch {
      // Continue to the other supported TypeScript extension.
    }
  }
  return nextResolve(`${baseUrl}.ts`, context);
}

export function resolve(specifier, context, nextResolve) {
  if (
    specifier === "server-only" &&
    context.conditions.includes("react-server")
  ) {
    return nextResolve("next/dist/compiled/server-only/empty.js", context);
  }
  if (
    specifier === "next/image" ||
    specifier === "next/link" ||
    specifier === "next/navigation" ||
    specifier === "next/server"
  ) {
    return nextResolve(`${specifier}.js`, context);
  }
  if (specifier.startsWith("@/")) {
    return resolveTypeScriptModule(
      new URL(specifier.slice(2), sourceRoot).href,
      context,
      nextResolve,
    );
  }
  if (
    (context.parentURL?.startsWith(sourceRoot) ||
      context.parentURL?.startsWith(cmsRoot)) &&
    specifier.startsWith(".") &&
    !specifier.endsWith(".ts")
  ) {
    return resolveTypeScriptModule(
      new URL(specifier, context.parentURL).href,
      context,
      nextResolve,
    );
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (
    (url.startsWith(sourceRoot) || url.startsWith(cmsRoot)) &&
    (url.endsWith(".ts") || url.endsWith(".tsx"))
  ) {
    const source = await readFile(new URL(url), "utf8");
    return {
      format: "module",
      shortCircuit: true,
      source: ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
        fileName: new URL(url).pathname,
      }).outputText,
    };
  }
  return nextLoad(url, context);
}
