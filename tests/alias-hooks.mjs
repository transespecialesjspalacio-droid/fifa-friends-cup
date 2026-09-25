import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve as pathResolve } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = "C:/fifa-friends-cup";

registerHooks({
  resolve: (specifier, context, nextResolve) => {
    if (!specifier.startsWith("@/")) {
      return nextResolve(specifier, context);
    }
    const relative = specifier.slice(2);
    const candidates = [
      pathResolve(projectRoot, relative),
      pathResolve(projectRoot, `${relative}.ts`),
      pathResolve(projectRoot, `${relative}.tsx`),
      pathResolve(projectRoot, relative, "index.ts"),
    ];
    const resolved = candidates.find((candidate) => existsSync(candidate));
    if (!resolved) {
      throw new Error(`No se pudo resolver el alias: ${specifier}`);
    }
    return nextResolve(pathToFileURL(resolved).href);
  },
});