import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
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
// 2. src/services/fallback-matching.ts — fallback local quando IA estiver fora
// =============================================
const fbDir = join(ROOT, "AutoMatch-Back/src/services");
const fbPath = join(fbDir, "fallback-matching.ts");

if (!existsSync(fbPath)) {
  mkdirSync(fbDir, { recursive: true });
  writeFileSync(fbPath, `\
const USE_CATEGORY_MAP: Record<string, Set<string>> = {
  work_commute: new Set(["Hatch", "Sedan", "Eletrico", "Premium"]),
  travel: new Set(["Sedan", "SUV", "Premium"]),
  ride_hailing: new Set(["Hatch", "Sedan", "Eletrico"]),
  off_road: new Set(["SUV", "Picape"]),
};

const ENV_CATEGORY_MAP: Record<string, Set<string>> = {
  city: new Set(["Hatch", "Sedan", "Eletrico", "Premium"]),
  highway: new Set(["Sedan", "SUV", "Premium"]),
  dirt_road: new Set(["SUV", "Picape"]),
};

const FAMILY_CATEGORY_MAP: Record<string, Set<string>> = {
  "2": new Set(["Hatch", "Sedan", "Eletrico", "Premium"]),
  "3-4": new Set(["Sedan", "SUV", "Picape"]),
  "5+": new Set(["SUV", "Picape"]),
};

const AGE_YEAR_MAP: Record<string, [number, number]> = {
  "0km": [2024, 2100],
  up_to_3_years: [2022, 2026],
  up_to_10_years: [2016, 2022],
};

export interface FallbackCarInput {
  id: string;
  nome: string;
  ano: number;
  preco: number;
  categoria: string;
  specs: {
    potencia: string;
    consumo: string;
  };
}

export interface FallbackMatch {
  id: string;
  nome: string;
  match_score: number;
  model_score: number;
  preference_score: number;
}

interface UserProfileForFallback {
  demographics: {
    familySize: string;
    primaryUse: string;
    primaryEnvironment: string;
  };
  financials: {
    maxBudget: number;
  };
  technicalPreferences: {
    categories: string[];
    vehicleAge: string;
  };
  priorities: {
    economy: number;
    power: number;
  };
}

function cleanNumeric(value: string | number): number {
  if (typeof value === "number") return value;
  const match = String(value).match(/(\\d+\\.?\\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function scoreYearFit(vehicleAge: string, carYear: number): number {
  const yearRange = AGE_YEAR_MAP[vehicleAge];
  if (!yearRange) return 0.5;
  const [minYear, maxYear] = yearRange;
  if (carYear >= minYear && carYear <= maxYear) return 1;
  const dist = Math.min(Math.abs(carYear - minYear), Math.abs(carYear - maxYear));
  return clamp(1 - dist / 10);
}

function preferenceBoost(
  user: UserProfileForFallback,
  car: FallbackCarInput
): number {
  const category = car.categoria;

  const selectedCategories = user.technicalPreferences.categories ?? [];
  const selectedCategoryScore = selectedCategories.includes(category) ? 1 : 0;

  const useScore = (USE_CATEGORY_MAP[user.demographics.primaryUse]?.has(category) ?? false) ? 1 : 0;
  const envScore = (ENV_CATEGORY_MAP[user.demographics.primaryEnvironment]?.has(category) ?? false) ? 1 : 0;
  const familyScore = (FAMILY_CATEGORY_MAP[user.demographics.familySize]?.has(category) ?? false) ? 1 : 0;
  const yearScore = scoreYearFit(user.technicalPreferences.vehicleAge, car.ano);

  return clamp(
    0.28 * selectedCategoryScore +
    0.34 * useScore +
    0.22 * envScore +
    0.10 * familyScore +
    0.06 * yearScore
  );
}

function scoreBudget(preco: number, maxBudget: number): number {
  const over = preco - maxBudget;
  if (over <= 0) return 1;
  return clamp(1 - over / maxBudget);
}

function scorePriorities(
  priorities: { economy: number; power: number },
  car: FallbackCarInput
): number {
  const total = priorities.economy + priorities.power;
  if (total === 0) return 0.5;
  const economyWeight = priorities.economy / total;
  const powerWeight = priorities.power / total;

  const consumption = cleanNumeric(car.specs.consumo);
  const power = cleanNumeric(car.specs.potencia);

  const consumptionNorm = clamp(consumption / 20);
  const powerNorm = clamp(power / 300);

  return economyWeight * consumptionNorm + powerWeight * powerNorm;
}

export function computeFallbackScores(
  userProfile: UserProfileForFallback,
  cars: FallbackCarInput[]
): FallbackMatch[] {
  if (cars.length === 0) return [];

  const results: FallbackMatch[] = [];

  for (const car of cars) {
    const preferenceScore = preferenceBoost(userProfile, car);
    const budgetScore = scoreBudget(car.preco, userProfile.financials.maxBudget);
    const priorityScore = scorePriorities(userProfile.priorities, car);

    const modelScore = (budgetScore + priorityScore) / 2;

    const finalScore = clamp(0.38 * modelScore + 0.62 * preferenceScore);

    results.push({
      id: car.id,
      nome: car.nome,
      match_score: finalScore,
      model_score: modelScore,
      preference_score: preferenceScore,
    });
  }

  results.sort((a, b) => b.match_score - a.match_score);

  return results;
}
`);
  console.log("✅ Created: src/services/fallback-matching.ts");
} else {
  console.log("⏭️  Already exists: src/services/fallback-matching.ts");
}

// =============================================
// 3. src/routes/matches.ts — fallback quando IA falhar
// =============================================
patchFile("AutoMatch-Back/src/routes/matches.ts", [
  [
    `import { getAuthClientFromRequest } from "../lib/supabase.js";

const router = Router();`,
    `import { getAuthClientFromRequest } from "../lib/supabase.js";
import { computeFallbackScores } from "../services/fallback-matching.js";

const router = Router();`,
  ],
  [
    `    const aiServiceUrl = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\\/+$/, "");
    const response = await fetch(\`\${aiServiceUrl}/match\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_profile: userProfile,
        available_cars: formattedCars
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Erro desconhecido na IA" }));
      throw new AppError(500, \`IA Service Error: \${errorData.detail || response.statusText}\`);
    }

    const aiResults = await response.json();`,
    `    const aiServiceUrl = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\\/+$/, "");

    let aiResults: { status: string; matches: { id: string; nome: string; match_score: number }[] };

    try {
      const response = await fetch(\`\${aiServiceUrl}/match\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: userProfile,
          available_cars: formattedCars
        }),
      });

      if (!response.ok) {
        throw new Error(\`IA retornou status \${response.status}\`);
      }

      aiResults = await response.json();
      console.log("[Matches] Resposta recebida da IA");
    } catch (err) {
      console.warn("[Matches] IA indispon\u00edvel, usando fallback local:", (err as Error).message);
      const fallbackScores = computeFallbackScores(userProfile, formattedCars);
      aiResults = { status: "success", matches: fallbackScores };
    }`,
  ],
]);
