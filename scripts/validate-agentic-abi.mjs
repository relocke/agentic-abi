#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

const requiredActions = ["create", "issue", "retire", "transfer", "open", "close"];
const requiredTables = ["accounts", "stat"];
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const symbolCode = /^[A-Z]{1,7}$/;

function frontmatter(body) {
  if (typeof body !== "string" || !body.startsWith("---\n")) return {};
  const end = body.indexOf("\n---\n", 4);
  if (end < 0) return {};

  return Object.fromEntries(
    body
      .slice(4, end)
      .split("\n")
      .map((line) => line.match(/^([a-z0-9-]+):\s*(.*?)\s*$/i))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  );
}

function fail(errors, message) {
  errors.push(message);
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: validate-agentic-abi.mjs <abi.json>");
    process.exit(2);
  }

  let abi;
  try {
    abi = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    console.error(`Invalid ABI JSON: ${error.message}`);
    process.exit(1);
  }

  const errors = [];
  if (typeof abi.version !== "string" || !abi.version.startsWith("eosio::abi/")) {
    fail(errors, "version must be an eosio::abi/* string");
  }

  for (const key of ["structs", "actions", "tables", "ricardian_clauses"]) {
    if (!Array.isArray(abi[key])) fail(errors, `${key} must be an array`);
  }

  const actions = new Set((abi.actions ?? []).map((action) => action.name));
  for (const name of requiredActions) {
    if (!actions.has(name)) fail(errors, `missing standard token action: ${name}`);
  }

  for (const action of abi.actions ?? []) {
    if (typeof action.ricardian_contract !== "string" || !action.ricardian_contract.trim()) {
      fail(errors, `action ${action.name ?? "<unknown>"} is missing a Ricardian contract`);
    }
  }

  const tables = new Set((abi.tables ?? []).map((table) => table.name));
  for (const name of requiredTables) {
    if (!tables.has(name)) fail(errors, `missing standard token table: ${name}`);
  }

  const clauses = abi.ricardian_clauses ?? [];
  const ids = new Set();
  for (const clause of clauses) {
    if (!clause?.id || typeof clause.body !== "string") {
      fail(errors, "every Ricardian clause must have string id and body values");
      continue;
    }
    if (ids.has(clause.id)) fail(errors, `duplicate Ricardian clause: ${clause.id}`);
    ids.add(clause.id);
  }

  const overview = clauses.find((clause) => clause.id === "ui.contract");
  if (!overview) {
    fail(errors, "missing ui.contract clause");
  } else {
    const metadata = frontmatter(overview.body);
    if (metadata.schema !== "relocke.ui/1") fail(errors, "ui.contract schema must be relocke.ui/1");
    if (!semver.test(metadata["spec-version"] ?? "")) fail(errors, "ui.contract spec-version must be SemVer");
    if (!semver.test(metadata["contract-version"] ?? "")) fail(errors, "ui.contract contract-version must be SemVer");
    if (!(metadata.types ?? "").split(",").includes("token")) fail(errors, "ui.contract types must include token");
    if (!metadata.title) fail(errors, "ui.contract title is required");
    if (metadata.revision && !/^[0-9a-f]{40}$/i.test(metadata.revision)) {
      fail(errors, "ui.contract revision must be a 40-character commit hash when present");
    }
  }

  const icon = clauses.find((clause) => clause.id === "ui.contract.icon");
  if (icon) {
    const metadata = frontmatter(icon.body);
    if (metadata.schema !== "relocke.ui/1") fail(errors, "ui.contract.icon schema must be relocke.ui/1");
    if (metadata["symbol-code"] && !symbolCode.test(metadata["symbol-code"])) {
      fail(errors, "ui.contract.icon symbol-code must contain 1–7 uppercase ASCII letters");
    }
    if (Buffer.byteLength(icon.body, "utf8") > 32 * 1024) fail(errors, "ui.contract.icon exceeds 32 KiB");
    if (!/<svg\b[^>]*xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["'][^>]*>/i.test(icon.body)) {
      fail(errors, "ui.contract.icon must contain an SVG namespace");
    }
    if (!/<svg\b[^>]*viewBox=["'][\d.\s-]+["'][^>]*>/i.test(icon.body)) {
      fail(errors, "ui.contract.icon must contain a numeric viewBox");
    }
    const unsafe = /<\s*(script|style|animate|set|foreignObject|iframe|object|embed|image|audio|video)\b|\son[a-z]+\s*=|\b(?:href|src)\s*=|data:/i;
    if (unsafe.test(icon.body)) fail(errors, "ui.contract.icon contains unsafe or external SVG features");
  }

  for (const name of requiredTables) {
    if (!ids.has(`table.${name}`)) fail(errors, `missing table.${name} clause`);
  }

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    console.error(`Agentic ABI validation failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  console.log(`Agentic ABI is structurally valid: ${file}`);
}

await main();
