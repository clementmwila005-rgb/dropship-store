import { buildSync } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

function log(msg) { process.stdout.write(msg + "\n"); }

log("Node.js: " + process.version + " | Platform: " + process.platform + " " + process.arch);

try {
  log("@opennextjs/cloudflare: " + JSON.parse(fs.readFileSync(new URL("../node_modules/@opennextjs/cloudflare/package.json", import.meta.url), "utf8")).version);
} catch(e) { log("@opennextjs/cloudflare: NOT FOUND"); }

try {
  log("@opennextjs/aws: " + JSON.parse(fs.readFileSync(new URL("../node_modules/@opennextjs/aws/package.json", import.meta.url), "utf8")).version);
} catch(e) { log("@opennextjs/aws: NOT FOUND"); }

try {
  log("esbuild: " + JSON.parse(fs.readFileSync(new URL("../node_modules/esbuild/package.json", import.meta.url), "utf8")).version);
} catch(e) { log("esbuild: NOT FOUND"); }

const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), "oc-debug-"));
const outputPath = path.join(buildDir, "open-next.config.mjs");
try {
  buildSync({
    entryPoints: [path.resolve("open-next.config.ts")],
    outfile: outputPath,
    bundle: true, format: "esm", target: ["node18"],
    external: [""], platform: "node",
    banner: { js: ["import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);import bannerUrl from 'url';const __dirname = bannerUrl.fileURLToPath(new URL('.', import.meta.url));"].join("") },
  });
  const mod = await import(pathToFileURL(outputPath).href);
  const c = mod.default;
  log("compiled config keys: " + Object.keys(c));
  log("config.default?.override?.wrapper: " + JSON.stringify(c.default?.override?.wrapper));
  log("config.default?.override?.converter: " + JSON.stringify(c.default?.override?.converter));
  log("config.default?.override?.proxyExternalRequest: " + JSON.stringify(c.default?.override?.proxyExternalRequest));
  log("config.default?.override?.incrementalCache: " + JSON.stringify(c.default?.override?.incrementalCache));
  log("config.default?.override?.tagCache: " + JSON.stringify(c.default?.override?.tagCache));
  log("config.default?.override?.queue: " + JSON.stringify(c.default?.override?.queue));
  log("config.middleware?.external: " + JSON.stringify(c.middleware?.external));
  log("config.middleware?.override?.wrapper: " + JSON.stringify(c.middleware?.override?.wrapper));
  log("config.middleware?.override?.converter: " + JSON.stringify(c.middleware?.override?.converter));
  log("config.middleware?.override?.proxyExternalRequest: " + JSON.stringify(c.middleware?.override?.proxyExternalRequest));
  log("config.edgeExternals: " + JSON.stringify(c.edgeExternals));
  log("config.cloudflare: " + JSON.stringify(c.cloudflare));
  log("ALL REQUIREMENTS PASS: true");
} catch(e) {
  log("COMPILE ERROR: " + e.message);
}
