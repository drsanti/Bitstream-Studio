#!/usr/bin/env npx tsx
/**
 * Export a Course Studio presentation pack (.trn-presentation-pack.json).
 *
 * Run from extension/:
 *   npm run presentation:pack:export -- --page pilot-bmi-accel-theory --out dist/pilot.pack.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPresentationPackFromCourse,
  buildPresentationPackFromPageIds,
} from "../content/presentationPackBuild";
import { PRESENTATION_PACK_EXTENSION } from "../schemas/presentationPack.v1";

const here = dirname(fileURLToPath(import.meta.url));
const defaultContentDir = join(here, "../content");

type Args = {
  contentDir: string;
  pageIds: string[];
  courseId: string | null;
  packId: string;
  title: string;
  outPath: string;
};

function parseArgs(argv: string[]): Args {
  let contentDir = defaultContentDir;
  const pageIds: string[] = [];
  let courseId: string | null = null;
  let packId = "course-pack";
  let title = "Course Studio pack";
  let outPath = join(process.cwd(), `course-pack${PRESENTATION_PACK_EXTENSION}`);

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--content" && argv[i + 1] != null) {
      contentDir = argv[i + 1]!;
      i += 1;
    } else if (arg === "--page" && argv[i + 1] != null) {
      pageIds.push(argv[i + 1]!);
      i += 1;
    } else if (arg === "--course" && argv[i + 1] != null) {
      courseId = argv[i + 1]!;
      i += 1;
    } else if (arg === "--id" && argv[i + 1] != null) {
      packId = argv[i + 1]!;
      i += 1;
    } else if (arg === "--title" && argv[i + 1] != null) {
      title = argv[i + 1]!;
      i += 1;
    } else if (arg === "--out" && argv[i + 1] != null) {
      outPath = argv[i + 1]!;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npm run presentation:pack:export -- (--course <courseId> | --page <pageId> [--page <pageId>...]) [--out path] [--id packId] [--title title]

Exports page JSON, referenced diagrams/scenes/markdown, and optional course manifest into a single ${PRESENTATION_PACK_EXTENSION} bundle.
`);
      process.exit(0);
    }
  }

  if (courseId == null && pageIds.length === 0) {
    courseId = "tesaiot-embedded";
  }

  return { contentDir, pageIds, courseId, packId, title, outPath };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { pack, pageIds, missingRefs } =
    args.courseId != null
      ? buildPresentationPackFromCourse(args.contentDir, args.courseId, {
          id: args.packId,
          title: args.title,
        })
      : buildPresentationPackFromPageIds(args.contentDir, args.pageIds, {
          id: args.packId,
          title: args.title,
        });

  if (missingRefs.length > 0) {
    console.error("Missing references:", missingRefs.join(", "));
    process.exit(1);
  }

  mkdirSync(dirname(args.outPath), { recursive: true });
  writeFileSync(args.outPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");

  console.log(`Wrote ${args.outPath}`);
  console.log(`  pages: ${pageIds.join(", ")}`);
  if (pack.courseId != null) {
    console.log(`  course: ${pack.courseId}`);
  }
  console.log(`  files: ${Object.keys(pack.files).length}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
