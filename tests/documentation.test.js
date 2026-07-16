import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { SCHEMA_VERSION } from "../js/utils/constants.js";

export default function documentationTest() {
  const readText = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
  const readme = readText("README.md");
  const storageSchema = readText("docs/STORAGE_SCHEMA.md");
  const uiFiles = [
    "index.html",
    "js/app.js",
    "js/ui/entry-screen.js",
    "js/ui/final-result-screen.js",
    "js/ui/machine-screen.js",
    "js/ui/play-result-screen.js"
  ].map(readText).join("\n");

  assert.equal(readme.includes(`Current saves use \`schemaVersion: ${SCHEMA_VERSION}\`.`), true);
  assert.equal(storageSchema.includes(`保存データは \`schemaVersion: ${SCHEMA_VERSION}\` を持つ。`), true);
  assert.equal(readme.includes("`schemaVersion: 4` へ移行"), false);
  assert.equal(storageSchema.includes("`schemaVersion: 4` へ移行"), false);

  assert.equal(uiFiles.includes("KING DEIGO"), false);
  assert.equal(uiFiles.includes("キングデイゴ"), false);
  assert.equal(uiFiles.includes("127.0.0.1"), false);
  assert.equal(uiFiles.includes("localhost"), false);
  assert.equal(uiFiles.includes("screen-manager.js\""), false);
  assert.equal(uiFiles.includes("screen-manager.js?v="), true);
  assert.equal(existsSync(new URL("../../.nojekyll", import.meta.url)), true);
}
