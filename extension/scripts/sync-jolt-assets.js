const fs = require('fs/promises');
const path = require('path');

async function copyFileIfChanged(src, dest) {
  try {
    const [srcStat, destStat] = await Promise.all([
      fs.stat(src),
      fs.stat(dest).catch(() => null),
    ]);

    if (
      destStat &&
      destStat.size === srcStat.size &&
      destStat.mtimeMs >= srcStat.mtimeMs
    ) {
      return;
    }
  } catch (error) {
    // ignore and fall back to copying
  }

  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const sourceDir = path.join(
    projectRoot,
    'node_modules',
    'jolt-physics',
    'dist'
  );
  const destDir = path.join(projectRoot, 'src', 'assets', 'jolt');

  const entries = await fs.readdir(sourceDir);

  await Promise.all(
    entries
      .filter((fileName) => fileName.endsWith('.js') || fileName.endsWith('.wasm'))
      .map(async (fileName) => {
        const src = path.join(sourceDir, fileName);
        const dest = path.join(destDir, fileName);
        await copyFileIfChanged(src, dest);
      })
  );
}

main().catch((error) => {
  console.error('[sync-jolt-assets] Failed to copy Jolt assets:', error);
  process.exit(1);
});

// Suppress successful execution output - only show errors
// This reduces noise in concurrently output

