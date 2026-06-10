#!/usr/bin/env npx tsx
/**
 * Validate Course Studio content (pages, diagrams, markdown, bindings, grid).
 *
 * Run from extension/: npm run presentation:validate
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatCourseValidateReport,
  validateCourseContent,
} from "../validate/courseContentValidate";

const here = dirname(fileURLToPath(import.meta.url));
const defaultContentDir = join(here, "../content");
const defaultGoldenFixturesDir = join(here, "../../../../tests/fixtures/course-studio-golden");

function parseArgs(argv: string[]): {
  contentDir: string;
  strict: boolean;
  golden: boolean;
  goldenFixturesDir: string;
} {
  let contentDir = defaultContentDir;
  let strict = false;
  let golden = false;
  let goldenFixturesDir = defaultGoldenFixturesDir;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--content" && argv[i + 1] != null) {
      contentDir = argv[i + 1]!;
      i += 1;
    } else if (arg === "--golden-fixtures" && argv[i + 1] != null) {
      goldenFixturesDir = argv[i + 1]!;
      i += 1;
    } else if (arg === "--strict") {
      strict = true;
    } else if (arg === "--golden") {
      golden = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npm run presentation:validate [-- --content <dir>] [--strict] [--golden]

Validates:
  - *.page.v1.json schema + grid overlaps + duplicate block ids
  - *.diagram.v1.json schema + binding catalog paths
  - markdown src references and diagram id references
  - optional --golden resolved diagram prop snapshots
`);
      process.exit(0);
    }
  }

  return { contentDir, strict, golden, goldenFixturesDir };
}

async function main(): Promise<void> {
  const { contentDir, strict, golden, goldenFixturesDir } = parseArgs(process.argv.slice(2));
  const result = validateCourseContent(contentDir, {
    golden,
    goldenFixturesDir,
  });
  const report = formatCourseValidateReport(result);
  console.log(report);

  const fail =
    !result.ok || (strict && result.issues.some((issue) => issue.severity === "warn"));

  if (fail) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
