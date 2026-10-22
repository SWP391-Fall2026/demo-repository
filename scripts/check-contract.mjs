import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root = path.resolve(import.meta.dirname, "..");
const spec = JSON.parse(
  readFileSync(
    path.join(root, "contracts/openapi/storage-rental.openapi.json"),
    "utf8",
  ),
);
const inventory = JSON.parse(
  readFileSync(path.join(root, "contracts/route-inventory.json"), "utf8"),
);
const actual = new Set();
function scan(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const filename = path.join(dir, item.name);
    if (item.isDirectory()) scan(filename);
    else if (item.name.endsWith("Controller.java")) {
      const s = readFileSync(filename, "utf8");
      const header = s.slice(0, s.indexOf("public class"));
      const base = header.match(/@RequestMapping\(([\s\S]*?)\)/);
      const values = (v) => [...v.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
      const bases = base ? values(base[1]) : [""];
      for (const m of s.matchAll(
        /@(Get|Post|Patch|Put|Delete)Mapping(?:\(([\s\S]*?)\))?\s+public\s+[^\n]+?\s+(\w+)\(/g,
      )) {
        const suffix = values((m[2] || "").split("consumes")[0]);
        for (const b of bases)
          for (const v of suffix.length ? suffix : [""])
            actual.add(m[1].toLowerCase() + " " + b + v);
      }
    }
  }
}
scan(path.join(root, "backend/src/main/java"));
const documented = Object.entries(spec.paths).flatMap(([p, ops]) =>
  Object.keys(ops).map((m) => m + " " + p),
);
assert.deepEqual(
  [...actual].sort(),
  documented.sort(),
  "Controller routes and contract differ",
);
assert.equal(inventory.length, actual.size);
const ids = new Set();
for (const [url, ops] of Object.entries(spec.paths))
  for (const [method, op] of Object.entries(ops)) {
    assert(
      op.operationId && !ids.has(op.operationId),
      "Operation ID must be unique",
    );
    ids.add(op.operationId);
    assert(
      op.responses && Object.keys(op.responses).length > 0,
      `Operation must document at least one response: ${method} ${url}`,
    );
    for (const p of url.matchAll(/\{(\w+)\}/g))
      assert(
        op.parameters?.some(
          (v) => v.in === "path" && v.name === p[1] && v.required,
        ),
      );
  }
function refs(x) {
  if (!x || typeof x !== "object") return;
  if (x.$ref) {
    assert(x.$ref.startsWith("#/components/schemas/"));
    assert(spec.components.schemas[x.$ref.split("/").at(-1)]);
  }
  Object.values(x).forEach(refs);
}
refs(spec);
const normalize = (url) =>
  url.split("?")[0].replace(/\$\{[^}]+\}|\{[^}]+\}/g, "{}");
const knownPaths = new Set(Object.keys(spec.paths).map(normalize));
let adapterCalls = 0;
function checkAdapters(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) checkAdapters(filename);
    else if (entry.name.endsWith(".api.js")) {
      const source = readFileSync(filename, "utf8");
      for (const call of source.matchAll(
        /(?:request|envelope|idempotentRequest)(?:<[^>]+>)?\(\s*([`"])(.*?)\1/gs,
      )) {
        assert(
          knownPaths.has(normalize("/api" + call[2])),
          `API adapter points to an undocumented route: ${filename}: ${call[2]}`,
        );
        adapterCalls++;
      }
    }
  }
}
checkAdapters(path.join(root, "frontend/src/features"));
console.log(
  `Contract check passed: ${actual.size} operations, ${Object.keys(spec.components.schemas).length} schemas, ${adapterCalls} frontend calls. This checks structure/routes, not runtime response conformance.`,
);
