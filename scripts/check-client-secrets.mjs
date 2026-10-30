import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const clientDirectory = join(process.cwd(), ".next", "static");
const serverOnlyNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "RSS_INGEST_SECRET",
  "ADMIN_USER_ID",
];

function readLocalEnvironment() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return new Map();

  const values = new Map();
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || !serverOnlyNames.includes(match[1])) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.length >= 8) values.set(match[1], value);
  }
  return values;
}

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

if (!existsSync(clientDirectory)) {
  throw new Error("Client build output is missing. Run the production build first.");
}

const localValues = readLocalEnvironment();
const violations = [];
for (const path of filesIn(clientDirectory)) {
  if (![".js", ".css", ".map", ".json"].includes(extname(path))) continue;
  const content = readFileSync(path, "utf8");

  for (const name of serverOnlyNames) {
    if (content.includes(name)) violations.push(`${name} reference in ${path}`);
  }
  for (const [name, value] of localValues) {
    if (content.includes(value)) violations.push(`${name} value in ${path}`);
  }
}

if (violations.length) {
  throw new Error(`Server-only configuration reached the client build:\n${violations.join("\n")}`);
}

console.log("Client bundle secret check passed.");
