const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const sourceRoot = path.resolve(__dirname, "../src");

const getJavaScriptFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getJavaScriptFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".js")
      ? [fullPath]
      : [];
  });

for (const file of getJavaScriptFiles(sourceRoot)) {
  const result = spawnSync(
    process.execPath,
    ["--check", file],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("Backend syntax check passed");
