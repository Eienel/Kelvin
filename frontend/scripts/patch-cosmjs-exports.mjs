#!/usr/bin/env node
// Strip restrictive `exports` fields from cosmjs-types and @cosmjs/*
// packages so deep imports like @cosmjs/amino/build/signdoc.js resolve.
// pnpm stores actual files under node_modules/.pnpm/<flat>/node_modules,
// not at the hoisted symlinks, so we have to walk both.
// Runs as postinstall — safe to re-run.
import { readFileSync, writeFileSync, readdirSync, statSync, lstatSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../node_modules", import.meta.url).pathname;
const TARGETS = new Set([
  "cosmjs-types",
  "@cosmjs/amino",
  "@cosmjs/crypto",
  "@cosmjs/encoding",
  "@cosmjs/math",
  "@cosmjs/proto-signing",
  "@cosmjs/stargate",
  "@cosmjs/tendermint-rpc",
  "@cosmjs/utils",
  "@cosmjs/json-rpc",
  "@cosmjs/socket",
  "@cosmjs/stream",
]);

let scanned = 0;
let patched = 0;

function tryPatch(pkgPath) {
  scanned++;
  let raw;
  try {
    raw = readFileSync(pkgPath, "utf8");
  } catch {
    return;
  }
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch {
    return;
  }
  if (!pkg.name || !TARGETS.has(pkg.name)) return;
  if (!pkg.exports) return;
  delete pkg.exports;
  try {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    patched++;
    console.log(`  patched ${pkg.name}  (${pkgPath.replace(ROOT, "<node_modules>")})`);
  } catch (e) {
    console.warn(`  could not write ${pkgPath}: ${e.message}`);
  }
}

function walk(dir, depth = 0) {
  if (depth > 10) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  // Look for a package.json directly in this directory.
  if (entries.includes("package.json")) {
    tryPatch(join(dir, "package.json"));
  }
  for (const e of entries) {
    if (e === "package.json" || e === "@types") continue;
    const p = join(dir, e);
    let s;
    try {
      // Use lstat so we don't follow pnpm's symlinks back to the same store.
      s = lstatSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) walk(p, depth + 1);
  }
}

console.log("[patch-cosmjs-exports] scanning node_modules…");
walk(ROOT);
console.log(`[patch-cosmjs-exports] scanned ${scanned} package.json files; patched ${patched}.`);
