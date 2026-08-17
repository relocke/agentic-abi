#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import process from "node:process";

const requiredTokenActions = ["create", "issue", "retire", "transfer", "open", "close"];
const requiredTokenTables = ["accounts", "stat"];
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const symbolCode = /^[A-Z]{1,7}$/;
const commitRevision = /^[0-9a-f]{40}$/i;
const sha256Digest = /^[0-9a-f]{64}$/;

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

function isPublicGithubRepository(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname.split("/").filter(Boolean).length === 2
    );
  } catch {
    return false;
  }
}

async function main() {
  const [file, contextFile] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: validate-agentic-abi.mjs <abi.json> [context.rloc.md]");
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
  const tables = new Set((abi.tables ?? []).map((table) => table.name));
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

  const overviewClauses = clauses.filter((clause) => clause.id === "ui.contract");
  if (overviewClauses.length !== 1) fail(errors, "exactly one ui.contract clause is required");
  const overviewMetadata = frontmatter(overviewClauses[0]?.body);
  if (overviewClauses.length) {
    if (overviewMetadata.schema !== "relocke.ui/1") fail(errors, "ui.contract schema must be relocke.ui/1");
    if (!semver.test(overviewMetadata["spec-version"] ?? "")) fail(errors, "ui.contract spec-version must be SemVer");
    if (!semver.test(overviewMetadata["contract-version"] ?? "")) fail(errors, "ui.contract contract-version must be SemVer");
    if (!overviewMetadata.title) fail(errors, "ui.contract title is required");
    if (overviewMetadata.revision && !commitRevision.test(overviewMetadata.revision)) {
      fail(errors, "ui.contract revision must be a 40-character commit hash when present");
    }
  }

  const types = new Set((overviewMetadata.types ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  const hasTokenSurface =
    types.has("token") ||
    requiredTokenActions.some((name) => actions.has(name)) ||
    requiredTokenTables.some((name) => tables.has(name));

  if (hasTokenSurface) {
    if (!types.has("token")) fail(errors, "ui.contract types must include token for a token surface");
    for (const name of requiredTokenActions) {
      if (!actions.has(name)) fail(errors, `missing standard token action: ${name}`);
    }
    for (const name of requiredTokenTables) {
      if (!tables.has(name)) fail(errors, `missing standard token table: ${name}`);
      if (!ids.has(`table.${name}`)) fail(errors, `missing table.${name} clause`);
    }
  }

  for (const action of abi.actions ?? []) {
    if (typeof action.ricardian_contract !== "string" || !action.ricardian_contract.trim()) {
      fail(errors, `action ${action.name ?? "<unknown>"} is missing a Ricardian contract`);
    }
  }

  const iconClauses = clauses.filter((clause) => clause.id === "ui.contract.icon");
  if (iconClauses.length > 1) fail(errors, "at most one ui.contract.icon clause is allowed");
  const icon = iconClauses[0];
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

  const projectClauses = clauses.filter((clause) => clause.id === "project.context");
  if (projectClauses.length > 1) fail(errors, "at most one project.context clause is allowed");
  const project = projectClauses[0];
  if (project) {
    const metadata = frontmatter(project.body);
    if (metadata.schema !== "relocke.ui/1") fail(errors, "project.context schema must be relocke.ui/1");
    if (metadata.type !== "project-context") fail(errors, "project.context type must be project-context");
    if (!metadata.title) fail(errors, "project.context title is required");
    if (!isPublicGithubRepository(metadata.repository)) fail(errors, "project.context repository must be a public HTTPS GitHub repository");
    if (!commitRevision.test(metadata.revision ?? "")) fail(errors, "project.context revision must be a full commit hash");
    if (metadata.path !== "context.rloc.md") fail(errors, "project.context path must be context.rloc.md");
    if (!sha256Digest.test(metadata.sha256 ?? "")) fail(errors, "project.context sha256 must be a 64-character lowercase digest");

    if (contextFile) {
      const bytes = await readFile(contextFile);
      if (bytes.byteLength > 256 * 1024) fail(errors, "project context exceeds 256 KiB");
      const digest = createHash("sha256").update(bytes).digest("hex");
      if (metadata.sha256 !== digest) fail(errors, "project context exact-byte SHA-256 does not match");
      const contextMetadata = frontmatter(bytes.toString("utf8"));
      if (contextMetadata.schema !== "relocke.context/1") fail(errors, "project context schema must be relocke.context/1");
    } else {
      fail(errors, "a local context.rloc.md is required to verify project.context");
    }
  } else if (contextFile) {
    fail(errors, "a context file was supplied but the ABI has no project.context clause");
  }

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    console.error(`Agentic ABI validation failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  console.log(`Agentic ABI is structurally valid: ${file}`);
}

await main();
