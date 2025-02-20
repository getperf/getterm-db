const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");

// package.json からバージョンを取得
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

const output = fs.createWriteStream(path.join("out", `getterm-${version}.zip`));
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`getterm-${version}.zip has been created (${archive.pointer()} bytes)`);
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);

// `code --locate-shell-integration-path bash` を実行してパスを取得
try {
  const bashIntegrationPath = execSync("code-insiders --locate-shell-integration-path bash", { encoding: "utf8" }).trim();
  const destinationPath = path.join("out", "shellIntegration-bash.sh");
  fs.copyFileSync(bashIntegrationPath, destinationPath);
  console.log(`Shell integration script copied to: ${destinationPath}`);
} catch (error) {
  console.error("Error locating or copying shell integration script:", error.message);
  process.exit(1);
}

// バンドルするファイルを追加
const filesToInclude = [
  "getterm.bat",
  `getterm-db-${version}.vsix`,
  "README.md",
  path.join("assets", "getterm-usage.gif"),
  path.join("out", "shellIntegration-bash.sh"),
];

filesToInclude.forEach((file) => {
    console.log(file);
  archive.file(file, { name: path.basename(file) });
});

archive.finalize();
