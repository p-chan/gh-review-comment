import pkg from "../package.json";

const version = `v${pkg.version}`;
const name = pkg.name;

const targets = [
  { target: "bun-darwin-x64", output: `${name}-darwin-amd64` },
  { target: "bun-darwin-arm64", output: `${name}-darwin-arm64` },
  { target: "bun-linux-x64", output: `${name}-linux-amd64` },
  { target: "bun-linux-arm64", output: `${name}-linux-arm64` },
  { target: "bun-windows-x64", output: `${name}-windows-amd64.exe` },
];

for (const { target, output } of targets) {
  await Bun.$`bun build --compile --target ${target} index.ts --outfile dist/${output}`;
}

await Bun.$`gh release create ${version} dist/* --title ${version} --generate-notes`;
