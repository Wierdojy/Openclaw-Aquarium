const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "dictionary", "cedict_ts.u8");
const outputPath = path.join(root, "dictionary-data.js");

function normalizeDefinition(rawDefinition) {
  return rawDefinition
    .split("/")
    .filter(Boolean)
    .slice(0, 4)
    .join("; ");
}

const dictionary = {};
const source = fs.readFileSync(sourcePath, "utf8");

for (const line of source.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
  if (!match) continue;
  const [, traditional, simplified, pinyin, rawDefinition] = match;
  const term = simplified || traditional;
  if (!term || dictionary[term]) continue;
  dictionary[term] = [pinyin, normalizeDefinition(rawDefinition)];
}

fs.writeFileSync(
  outputPath,
  `window.MUYU_DICTIONARY = ${JSON.stringify(dictionary)};\n`,
  "utf8"
);

console.log(`${Object.keys(dictionary).length} dictionary entries`);
