#!/usr/bin/env node
// Strip restrictive `exports` fields from cosmjs-types and @cosmjs/*
// packages so deep imports like @cosmjs/amino/build/signdoc.js resolve.
// Runs as postinstall — safe to re-run.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../node_modules", import.meta.url).pathname;
const TARGETS = /^(cosmjs-types|@cosmjs[\\/](amino|crypto|encoding|math|proto-signing|stargate|tendermint-rpc|utils|json-rpc|socket|stream))$/;

let patched = 0;

function walk(dir, depth = 0) {
  if (depth > 8) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    if (e === "node_modules" || e.startsWith(".") || e === "@types") continue;
    const p = join(dir, e);
    let s;
    try {
      s = statSync(p);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;
    if (e === "package.json") continue;
    // Recurse, but check for package.json at every directory.
    const pkgPath = join(p, "package.json");
    try {
      const raw = readFileSync(pkgPath, "utf8");
      const pkg = JSON.parse(raw);
      const name = pkg.name;
      if (name && TARGETS.test(name) && pkg.exports) {
        delete pkg.exports;
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
        patched++;
        console.log(`  patched ${name} (${pkgPath.replace(ROOT, "")})`);
      }
    } catch {
      // not a package dir
    }
    walk(p, depth + 1);
  }
}

console.log("[patch-cosmjs-exports] scanning node_modules…");
walk(ROOT);
console.log(`[patch-cosmjs-exports] done — patched ${patched} package(s).`);
