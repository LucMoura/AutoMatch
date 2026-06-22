import { readFileSync, writeFileSync } from "fs";

const FILE = "AutoMatch-Front/src/environments/environment.prod.ts";
let content = readFileSync(FILE, "utf8");

content = content.replace(
  "apiUrl: 'https://api.automatch.com/api'",
  "apiUrl: '/api'",
);

writeFileSync(FILE, content);
