const fs = require("fs");
const path = require("path");
const Twig = require("twig");

const templatesDir = path.resolve(process.cwd(), "src/templates");
const viewsDir = path.join(templatesDir, "views");
const destDir = path.resolve(process.cwd(), "dist");

// Optional: src/templates/pages.json maps template path -> { title, ... }
let pageData = {};
try {
  const dataPath = path.join(templatesDir, "pages.json");
  if (fs.existsSync(dataPath)) {
    pageData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  }
} catch (_) {}

// All .twig files under views/ (and subfolders) are entry pages.
function getEntryTemplates(dir, base = dir) {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      entries.push(...getEntryTemplates(full, base));
    } else if (stat.isFile() && name.endsWith(".twig")) {
      entries.push(path.relative(base, full));
    }
  }
  return entries;
}

function render(relativePath, data = {}) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(templatesDir, relativePath);
    Twig.renderFile(fullPath, data, (err, html) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
}

async function build() {
  if (!fs.existsSync(viewsDir)) {
    console.error("Views dir not found:", viewsDir);
    process.exit(1);
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = getEntryTemplates(viewsDir).map((rel) => path.join("views", rel));
  for (const rel of entries) {
    const viewsRel = rel.replace(/^views\//, "").replace(/\.twig$/, "");
    const isIndex = path.basename(viewsRel) === "index";
    const outRel = isIndex
      ? "index.html"
      : path.join(viewsRel, "index.html");
    const outPath = path.join(destDir, outRel);
    const outDir = path.dirname(outPath);
    fs.mkdirSync(outDir, { recursive: true });
    const data = pageData[rel] || pageData[rel.replace(/\.twig$/, "")] || {};
    try {
      const html = await render(rel, data);
      fs.writeFileSync(outPath, html, "utf8");
      console.log("Rendered:", rel, "->", path.relative(process.cwd(), outPath));
    } catch (e) {
      console.error("Error rendering", rel, e.message);
      process.exitCode = 1;
    }
  }
}

build();
