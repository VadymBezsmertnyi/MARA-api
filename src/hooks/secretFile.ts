import fs from "fs";

export const readSecretJson = (envName: string, fallbackPath: string) =>
  JSON.parse(fs.readFileSync(process.env[envName] || fallbackPath, "utf8"));
