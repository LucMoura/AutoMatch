import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function patchFile(relativePath, replacements) {
  const filePath = join(ROOT, relativePath);
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  let content = readFileSync(filePath, "utf8");
  for (const [search, replace] of replacements) {
    if (!content.includes(search)) {
      console.warn(`Pattern not found in ${relativePath}: ${search.slice(0, 50)}...`);
      continue;
    }
    content = content.replace(search, replace);
  }
  writeFileSync(filePath, content);
  console.log(`✅ Patched: ${relativePath}`);
}

// =============================================
// 1. src/index.ts — export app + conditional listen
// =============================================
patchFile("AutoMatch-Back/src/index.ts", [
  [
    "const app = express();",
    "export const app = express();",
  ],
  [
    `app.listen(PORT, () => {\n  console.log(\`AutoMatch API rodando em http://localhost:\${PORT}/api\`);\n});`,
    `if (process.env.VERCEL !== "1") {\n  app.listen(PORT, () => {\n    console.log(\`AutoMatch API rodando em http://localhost:\${PORT}/api\`);\n  });\n}`,
  ],
]);

// =============================================
// 2. routes/matches.ts — make recommendations public (no requireAuth)
// =============================================
patchFile("AutoMatch-Back/src/routes/matches.ts", [
  [
    'router.post("/recommendations", requireAuth,',
    'router.post("/recommendations",',
  ],
  [
    "const userId = req.userId!;",
    "const userId = req.userId;",
  ],
  [
    "if (aiResults.matches && aiResults.matches.length > 0) {",
    "if (userId && aiResults.matches && aiResults.matches.length > 0) {",
  ],
]);


