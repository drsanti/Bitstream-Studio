/**
 * CLI: verify TERNION free-pack files under VS Code / Cursor globalStorage.
 *
 * Usage (from extension/):
 *   npm run check:free-pack-storage
 *   npx tsx src/asset-sync/dev/check-free-pack-globalstorage.ts
 *   npx tsx src/asset-sync/dev/check-free-pack-globalstorage.ts --require-files
 */

import {
  formatFreePackStorageDiagnosisReport,
  runFreePackStorageDiagnosis,
} from "../diagnoseFreePackStorageReport";

async function main(): Promise<void> {
  const requireFiles = process.argv.includes("--require-files");
  const diagnosis = await runFreePackStorageDiagnosis();
  console.log(formatFreePackStorageDiagnosisReport(diagnosis));
  if (requireFiles && diagnosis.maxFileCount === 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
