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
// 2. routes/matches.ts — make recommendations public
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

// =============================================
// 3. middleware/auth.ts — JWT fallback without service key
// =============================================
patchFile("AutoMatch-Back/src/middleware/auth.ts", [
  [
    `import supabaseAdmin from "../lib/supabase.js";`,
    `import supabaseAdmin, { createAuthClient } from "../lib/supabase.js";`,
  ],
  [
    `export async function requireAuth(`,
    `function decodeJwtPayload(
  token: string,
): { sub?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(`,
  ],
  [
    `  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }

    req.userId = user.id;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    req.userRole = (profile as { role: string } | null)?.role || "USER";
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }`,
    `  const payload = decodeJwtPayload(token);
  if (!payload?.sub) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }

  req.userId = payload.sub;
  req.userRole = "USER";

  // Fetch role with authenticated client (works without SUPABASE_SERVICE_KEY)
  try {
    const authClient = createAuthClient(token);
    const { data: profile } = await authClient
      .from("profiles")
      .select("role")
      .eq("id", payload.sub)
      .single();
    req.userRole = (profile as { role: string } | null)?.role || "USER";
  } catch {}

  next();`,
  ],
]);
