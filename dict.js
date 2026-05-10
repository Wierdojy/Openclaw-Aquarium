const fs = require('fs');
const path = require('path');

// Load CEDICT
const cedictPath = path.join(__dirname, 'cedict.txt');
const lines = fs.readFileSync(cedictPath, 'utf-8').split('\n');

// Index by simplified character + multi-character words
const charIndex = {}; // char -> [{ traditional, simplified, pinyin, definitions }]
const wordIndex = {}; // simplified word -> { traditional, pinyin, definitions }

for (const line of lines) {
  if (line.startsWith('#') || line.trim() === '') continue;

  const match = line.match(/^(\S+) (\S+) \[([^\]]+)\] \/(.+)\//);
  if (!match) continue;

  const [, traditional, simplified, pinyin, defsStr] = match;
  const definitions = defsStr.split('/').filter(d => d.trim());

  const entry = { traditional, simplified, pinyin, definitions };

  // Index by simplified word
  wordIndex[simplified] = entry;

  // Index each character
  for (const char of simplified) {
    if (!charIndex[char]) charIndex[char] = [];
    charIndex[char].push(entry);
  }
}

console.log(`Loaded ${Object.keys(wordIndex).length} words, ${Object.keys(charIndex).length} unique chars`);

// Lookup: given a text and a character position, return the best word match + definition
function lookup(text, pos) {
  const char = text[pos];
  if (!char || !charIndex[char]) return null;

  // Try to match longest word first (up to 4 chars)
  for (let len = 4; len >= 1; len--) {
    if (pos + len > text.length) continue;
    const word = text.substring(pos, pos + len);
    if (wordIndex[word]) {
      return {
        word,
        pinyin: wordIndex[word].pinyin,
        definitions: wordIndex[word].definitions.slice(0, 3),
        len
      };
    }
  }

  // Fallback: single character lookup
  const charDefs = charIndex[char];
  if (charDefs && charDefs.length > 0) {
    // Find the most relevant entry (the one where the char IS the word)
    const singleCharWord = charDefs.find(e => e.simplified === char);
    if (singleCharWord) {
      return {
        word: char,
        pinyin: singleCharWord.pinyin,
        definitions: singleCharWord.definitions.slice(0, 3),
        len: 1
      };
    }
    // Fallback: first entry that starts with this char
    return {
      word: char,
      pinyin: charDefs[0].pinyin,
      definitions: charDefs[0].definitions.slice(0, 3),
      len: 1
    };
  }

  return null;
}

// Batch lookup: find all words in text
function lookupAll(text) {
  const results = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/[\u4e00-\u9fff]/.test(char)) {
      const found = lookup(text, i);
      if (found) {
        results.push({ ...found, pos: i });
        i += found.len;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  return results;
}

module.exports = { lookup, lookupAll, charIndex, wordIndex };