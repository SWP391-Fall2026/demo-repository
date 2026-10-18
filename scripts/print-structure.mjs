import { readdirSync } from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const excluded = new Set([".git", "node_modules", "target", "dist", ".idea"]);
function tree(dir, prefix = "") {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        !excluded.has(e.name) &&
        !e.name.endsWith(".tsbuildinfo") &&
        e.name !== ".env",
    )
    .sort(
      (a, b) =>
        Number(b.isDirectory()) - Number(a.isDirectory()) ||
        a.name.localeCompare(b.name),
    );
  entries.forEach((e, i) => {
    const last = i === entries.length - 1;
    console.log(
      prefix + (last ? "└── " : "├── ") + e.name + (e.isDirectory() ? "/" : ""),
    );
    if (e.isDirectory())
      tree(path.join(dir, e.name), prefix + (last ? "    " : "│   "));
  });
}
console.log("storage-rental/");
tree(root);
