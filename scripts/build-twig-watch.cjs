const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const templatesDir = path.resolve(process.cwd(), "src/templates");
const script = path.join(__dirname, "build-twig.cjs");

function run() {
  spawn("node", [script], { stdio: "inherit" });
}

function watch(dir) {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { recursive: true }, (_, filename) => {
    if (filename && (filename.endsWith(".twig") || filename.endsWith(".html"))) {
      run();
    }
  });
  run();
}

watch(templatesDir);
