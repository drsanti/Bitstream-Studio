#!/usr/bin/env npx tsx
/**
 * Import a Course Studio presentation pack into content/.
 *
 * Run from extension/:
 *   npm run presentation:pack:import -- --pack dist/pilot-bmi.trn-presentation-pack.json
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { importPresentationPackToContentDir } from "../content/presentationPackImportDisk";
import { parsePresentationPackV1 } from "../schemas/presentationPack.v1";
import { validateCourseContent } from "../validate/courseContentValidate";

const here = dirname(fileURLToPath(import.meta.url));
const defaultContentDir = join(here, "../content");

type Args = {
  packPath: string;
  contentDir: string;
  overwrite: boolean;
  validate: boolean;
};

function parseArgs(argv: string[]): Args {
  let packPath = "";
  let contentDir = defaultContentDir;
  let overwrite = false;
  let validate = true;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--pack" && argv[i + 1] != null) {
      packPath = argv[i + 1]!;
      i += 1;
    } else if (arg === "--content" && argv[i + 1] != null) {
      contentDir = argv[i + 1]!;
      i += 1;
    } else if (arg === "--overwrite") {
      overwrite = true;
    } else if (arg === "--no-validate") {
      validate = false;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npm run presentation:pack:import -- --pack <file.trn-presentation-pack.json> [--content dir] [--overwrite] [--no-validate]`);
      process.exit(0);
    }
  }

  if (packPath.length === 0) {
    console.error("Missing required --pack <path>");
    process.exit(1);
  }

  return { packPath, contentDir, overwrite, validate };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(readFileSync(args.packPath, "utf8")) as unknown;
  const pack = parsePresentationPackV1(raw);
  const result = importPresentationPackToContentDir(pack, args.contentDir, {
    overwrite: args.overwrite,
  });

  console.log(`Imported pack "${pack.id}" into ${args.contentDir}`);
  console.log(`  written: ${result.written.length}`);
  console.log(`  skipped: ${result.skipped.length}`);
  console.log(`  pages: ${result.pageIds.join(", ")}`);

  if (result.skipped.length > 0) {
    console.log("Skipped (already exist):");
    for (const path of result.skipped) {
      console.log(`  ${path}`);
    }
  }

  if (args.validate) {
    const validation = validateCourseContent(args.contentDir);
    console.log("");
    console.log(validation.ok ? "Validation passed." : "Validation failed.");
    if (!validation.ok) {
      for (const issue of validation.issues) {
        console.log(`[${issue.severity}] ${issue.code}: ${issue.message}`);
      }
      process.exit(1);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
