const esbuild = require("esbuild");
const path = require("node:path");

const isWatch = process.argv.includes("--watch");

function stageSerialportRuntime() {
  require(path.join(__dirname, "stage-serialport-runtime.cjs"));
}

const buildOptions = {
  entryPoints: [
    "./src/extension.ts",
    "./src/combined-bridge-entry.ts",
    {
      in: "./src/ai/run.ai.bridge.ts",
      out: "ai/run.ai.bridge",
    },
  ],
  bundle: true,
  outdir: "out",
  external: ["vscode", "serialport"],
  format: "cjs",
  platform: "node",
  target: "node16",
  sourcemap: true,
  minify: false,
  plugins: [
    {
      name: "stage-serialport-runtime",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            stageSerialportRuntime();
          }
        });
      },
    },
  ],
};

if (isWatch) {
  const ctx = esbuild.context(buildOptions);
  ctx
    .then((context) => {
      return context.watch();
    })
    .then(() => {
      console.log("Watching for changes...");
    })
    .catch((error) => {
      console.error("Build failed:", error);
      process.exit(1);
    });
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
