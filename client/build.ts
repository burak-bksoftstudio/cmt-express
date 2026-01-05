import tailwind from "bun-plugin-tailwind";
import { rmSync, cpSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";

const outdir = "./dist";

// Clean output directory
if (existsSync(outdir)) {
  rmSync(outdir, { recursive: true });
}
mkdirSync(outdir, { recursive: true });

// Build with Bun
const result = await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: join(outdir, "assets"),
  splitting: true,
  minify: true,
  target: "browser",
  plugins: [tailwind],
  publicPath: "/assets/",
  naming: {
    entry: "[name]-[hash].[ext]",
    chunk: "[name]-[hash].[ext]",
    asset: "[name]-[hash].[ext]",
  },
  // Replace import.meta.env.VITE_* at build time (like Vite does)
  define: {
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_CLERK_PUBLISHABLE_KEY || ""
    ),
    "import.meta.env.MODE": JSON.stringify(process.env.NODE_ENV || "production"),
    "import.meta.env.DEV": "false",
    "import.meta.env.PROD": "true",
  },
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Find output files using Bun's output.kind property
let jsFile = "";
let cssFile = "";
for (const output of result.outputs) {
  const name = basename(output.path);
  // Use output.kind to find the actual entry point
  if (output.kind === "entry-point" && name.endsWith(".js")) {
    jsFile = `/assets/${name}`;
  }
  if (name.endsWith(".css")) {
    cssFile = `/assets/${name}`;
  }
}

// Generate index.html
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CMT - Conference Management Tool</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${jsFile}"></script>
  </body>
</html>`;

await Bun.write(join(outdir, "index.html"), html);

// Copy static assets
if (existsSync("./public")) {
  cpSync("./public", outdir, { recursive: true });
}

// Copy vite.svg if exists
if (existsSync("./vite.svg")) {
  cpSync("./vite.svg", join(outdir, "vite.svg"));
}

console.log(`✓ Built ${result.outputs.length + 1} files`);
for (const output of result.outputs) {
  const size = output.size / 1024;
  console.log(`  ${basename(output.path)} (${size.toFixed(2)} KB)`);
}
console.log(`  index.html`)
