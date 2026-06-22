import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(__dirname, "..", "AutoMatch-Front");

// =============================================
// 1. Patch environment.prod.ts — apiUrl
// =============================================
const envFile = join(FRONTEND, "src", "environments", "environment.prod.ts");
let env = readFileSync(envFile, "utf8");
env = env.replace(
  "apiUrl: 'https://api.automatch.com/api'",
  "apiUrl: '/api'",
);
writeFileSync(envFile, env);
console.log("✅ environment.prod.ts — apiUrl patched to /api");

// =============================================
// 2. Add placeholder SVG to assets
// =============================================
const assetsDir = join(FRONTEND, "src", "assets");
if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });

const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
  <rect width="400" height="300" fill="#e2e8f0" rx="8"/>
  <path d="M120 180l30-60h100l30 60H120z" fill="#94a3b8"/>
  <circle cx="150" cy="185" r="20" fill="#64748b"/>
  <circle cx="250" cy="185" r="20" fill="#64748b"/>
  <rect x="130" y="120" width="140" height="8" rx="4" fill="#94a3b8"/>
  <rect x="150" y="100" width="100" height="6" rx="3" fill="#94a3b8"/>
  <text x="200" y="240" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="14">Sem imagem</text>
</svg>`;

writeFileSync(join(assetsDir, "car-placeholder.svg"), placeholder);
console.log("✅ assets/car-placeholder.svg — created");

// =============================================
// 3. Patch HTML templates — image fallback
// =============================================
const templates = [
  join(FRONTEND, "src", "app", "matches", "vehicle-card.component.html"),
  join(FRONTEND, "src", "app", "matches", "saved-matches-dashboard.component.html"),
  join(FRONTEND, "src", "app", "comparison-page", "vehicle-compare-card.component.html"),
  join(FRONTEND, "src", "app", "comparison-page", "car-selector-modal.component.html"),
  join(FRONTEND, "src", "app", "admin", "admin-cars", "admin-cars.component.html"),
];

const PLACEHOLDER = "/assets/car-placeholder.svg";

for (const file of templates) {
  let content = readFileSync(file, "utf8");

  content = content.replace(
    /<img\s+\[src\]="car\.images\.main"/g,
    `<img [src]="(car.images.main || '${PLACEHOLDER}')"`,
  );
  content = content.replace(
    /<img\s+\[src\]="match\.car\.images\.main"/g,
    `<img [src]="(match.car.images.main || '${PLACEHOLDER}')"`,
  );

  writeFileSync(file, content);
  console.log(`✅ ${file} — image fallback added`);
}
