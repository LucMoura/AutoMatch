import { readFileSync, writeFileSync } from "fs";

const FILE = "AutoMatch-Back/src/index.ts";
let content = readFileSync(FILE, "utf8");

content = content.replace(
  "const app = express();",
  "export const app = express();",
);

content = content.replace(
  `app.listen(PORT, () => {\n  console.log(\`AutoMatch API rodando em http://localhost:\${PORT}/api\`);\n});`,
  `if (process.env.VERCEL !== "1") {\n  app.listen(PORT, () => {\n    console.log(\`AutoMatch API rodando em http://localhost:\${PORT}/api\`);\n  });\n}`,
);

writeFileSync(FILE, content);
