const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { chromium } = require('playwright');
const { pinyin } = require('pinyin-pro');
const dict = require('./dict');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Persistent browser instance ---
let browser = null;
let fetchContext = null;
const browserOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
};

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch(browserOptions);
    browser.on('disconnected', () => { browser = null; fetchContext = null; });
    console.log('Browser launched');
  }
  return browser;
}

async function getFetchContext() {
  if (!fetchContext) {
    const b = await getBrowser();
    fetchContext = await b.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    await fetchContext.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  }
  return fetchContext;
}

// --- Caches ---
const chapterCache = new Map(); // chapter list cache
const translateCache = new Map(); // translation cache
const CACHE_TTL = 60 * 60 * 1000;

// === Chapter list ===
app.get('/api/novel/:id/chapters', async (req, res) => {
  const { id } = req.params;
  const cached = chapterCache.get(id);
  if (cached && Date.now() < cached.expiry) {
    return res.json({ chapters: cached.data, cached: true });
  }
  try {
    const chapters = await fetchChapterList(id);
    chapterCache.set(id, { data: chapters, expiry: Date.now() + CACHE_TTL });
    res.json({ chapters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Search novels ===
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 1) return res.json({ results: [] });
  try {
    const results = await searchNovels(q);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Fetch chapter ===
app.post('/api/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const content = await fetchChapter(url);
    if (!content || content.length < 50) {
      return res.status(502).json({ error: 'Could not fetch chapter content.' });
    }
    const lines = splitIntoLines(content);
    const annotated = lines.map(line => ({
      text: line,
      pinyinBuild: addPinyin(line)
    }));
    const urlMatch = url.match(/zhuishu\.com\/id(\d+)\/(\d+)\.html/);
    res.json({ lines: annotated, totalLines: annotated.length, novelId: urlMatch?.[1], chapterId: urlMatch?.[2] });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// === Dictionary lookup ===
app.get('/api/dict/:text', (req, res) => {
  const text = decodeURIComponent(req.params.text);
  if (!text) return res.json({ results: [] });
  if (/[\u4e00-\u9fff]/.test(text)) {
    const result = dict.lookup(text, 0);
    if (result) {
      const py = pinyin(result.word, { toneType: 'symbol' });
      return res.json({ word: result.word, pinyin: py, definitions: result.definitions });
    }
  }
  res.json({ word: text, pinyin: '', definitions: ['(not found)'] });
});

// === Batch dictionary ===
app.post('/api/dict/batch', (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ words: [] });
  const words = dict.lookupAll(text);
  const withPinyin = words.map(w => ({ ...w, pinyin: pinyin(w.word, { toneType: 'symbol' }) }));
  res.json({ words: withPinyin });
});

// === Translate line (cached) ===
app.post('/api/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  if (translateCache.has(text)) return res.json({ translation: translateCache.get(text) });
  try {
    const translation = await translateLine(text);
    if (translation) translateCache.set(text, translation);
    res.json({ translation });
  } catch {
    res.json({ translation: '' });
  }
});

// === Batch translate ===
app.post('/api/translate-batch', async (req, res) => {
  const { lines: inputLines } = req.body;
  if (!inputLines?.length) return res.status(400).json({ error: 'Lines required' });
  try {
    const results = [];
    for (const line of inputLines) {
      if (translateCache.has(line)) {
        results.push(translateCache.get(line));
      } else {
        const t = await translateLine(line);
        if (t) translateCache.set(line, t);
        results.push(t || '');
        await new Promise(r => setTimeout(r, 200));
      }
    }
    res.json({ translations: results });
  } catch {
    res.status(500).json({ error: 'Translation failed' });
  }
});

// === Search novels on zhuishu ===
async function searchNovels(query) {
  const ctx = await getFetchContext();
  const page = await ctx.newPage();
  try {
    await page.goto('https://www.zhuishu.com/search.php?q=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.book-list a, a[href*="/id"]'))
        .filter(a => a.href.includes('/id') && a.textContent.trim().length > 1)
        .map(a => {
          const idMatch = a.href.match(/id(\d+)\/?$/);
          return { name: a.textContent.trim(), url: a.href, id: idMatch?.[1], href: a.href };
        })
        .filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i);
    });
    return results;
  } finally {
    await page.close();
  }
}

// === Fetch chapter list ===
async function fetchChapterList(novelId) {
  const ctx = await getFetchContext();
  const page = await ctx.newPage();
  try {
    await page.goto('https://www.zhuishu.com/id' + novelId + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const allChapters = [];
    const seen = new Set();
    for (const pg of ['1', '2', '3']) {
      if (pg !== '1') {
        await page.evaluate((p) => {
          for (const a of document.querySelectorAll('a')) {
            if (a.textContent.trim() === p) { a.click(); return; }
          }
        }, pg);
        await page.waitForTimeout(1500);
      }
      const pageChs = await page.evaluate((id) => {
        return Array.from(document.querySelectorAll('a'))
          .filter(a => a.href?.includes('id' + id + '/') && a.href.endsWith('.html') && a.textContent.trim().length > 1)
          .map(a => ({ url: a.href, title: a.textContent.trim() }));
      }, novelId);
      for (const ch of pageChs) {
        if (!seen.has(ch.url)) { seen.add(ch.url); allChapters.push(ch); }
      }
    }
    allChapters.sort((a, b) => parseInt(a.url.split('/').pop()) - parseInt(b.url.split('/').pop()));
    return allChapters;
  } finally {
    await page.close();
  }
}

// === Fetch chapter content ===
async function fetchChapter(url) {
  const ctx = await getFetchContext();
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);

    const rawContent = await page.evaluate(() => {
      for (const sel of ['#content', '.content', '.chapter-content', '.read-content', '.txtnav', 'article', '#chaptercontent']) {
        const el = document.querySelector(sel);
        if (el?.textContent.trim().length > 300) return el.textContent.trim();
      }
      const paragraphs = Array.from(document.querySelectorAll('p'));
      const pText = paragraphs.map(p => p.textContent.trim()).filter(t => t.length > 15 && t.length < 5000);
      if (pText.length > 3) return pText.join('\n');
      return document.body.innerText;
    });

    return cleanContent(rawContent, url);
  } finally {
    await page.close();
  }
}

// === Content cleaning ===
function cleanContent(text, url) {
  let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const junkPatterns = [
    /^首页$/, /搜索/, /^上一章$/, /^下一章$/, /^目录$/, /^存书签$/,
    /^字体/, /^换手/, /^关灯/, /下一页/, /上一页/, /追看新章节/,
    /下载本站/, /无广告/, /^广告/, /本站所有收录/, /如有侵权/, /网站地图/,
    /^登录$/, /^注册$/, /^玄幻$/, /^武侠$/, /^都市$/, /^历史$/,
    /^网游$/, /^科幻$/, /^言情$/, /^其他$/, /^排行$/, /^完本$/, /^首页/,
    /追书网/, /^返回/, /^第\(\d+\/\d+\)页$/, /^\d+\/\d+$/, /超速首发/,
    /最新最快/, /无弹窗/,
  ];

  let contentStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 50) { contentStart = i; break; }
  }

  let filtered = lines.slice(contentStart).filter(line => {
    for (const pat of junkPatterns) {
      if (pat.test(line)) return false;
    }
    if (/^[~～\s]+$/.test(line)) return false;
    line = line.replace(/\(\s*\d+\s*\/\s*\d+\s*\)\s*页/g, '');
    line = line.replace(/[~～]{2,}/g, '').replace(/超速首发/g, '').trim();
    return line.length > 3;
  }).map(l => l.trim());

  const endIdx = filtered.findIndex(l => /^上一章/.test(l) || /^下一章/.test(l) || /追看新章节/.test(l));
  if (endIdx > 3) filtered = filtered.slice(0, endIdx);

  return filtered.join('\n');
}

// === Pinyin ===
function addPinyin(text) {
  try {
    return text.split('').map(c => ({
      char: c,
      pinyin: /[\u4e00-\u9fff]/.test(c) ? pinyin(c, { toneType: 'symbol' }) : ''
    }));
  } catch {
    return text.split('').map(c => ({ char: c, pinyin: '' }));
  }
}

// === Translation (cached, rate-limited) ===
async function translateLine(text) {
  if (!/[\u4e00-\u9fff]/.test(text)) return text;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text.slice(0, 500))}`;
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return '';
    const data = await resp.json();
    return data?.[0]?.map(item => item[0]).join('') || '';
  } catch {
    return '';
  }
}

// === Split into sentences ===
function splitIntoLines(text) {
  const sentences = text.split(/(?<=[。！？\n])/).map(l => l.trim()).filter(l => l.length > 5);
  if (sentences.length > 2) return sentences.slice(0, 300);
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 5).slice(0, 300);
}

// === Start server ===
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Aquarium reader running on http://0.0.0.0:${PORT}`);
});

// Try to also start HTTPS with self-signed cert
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  https.createServer(httpsOptions, app).listen(3443, '0.0.0.0', () => {
    console.log('HTTPS server on https://0.0.0.0:3443');
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (browser) await browser.close();
  process.exit(0);
});