const express = require('express');
const path = require('path');
const { chromium } = require('playwright');
const { pinyin } = require('pinyin-pro');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Get chapter list for a novel ===
app.get('/api/novel/:id/chapters', async (req, res) => {
  const { id } = req.params;
  try {
    const chapters = await fetchChapterList(id);
    res.json({ chapters });
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
      return res.status(502).json({ error: 'Could not fetch chapter content. The site may block automated access.' });
    }

    const lines = splitIntoLines(content);
    const annotated = lines.map(line => ({
      text: line,
      pinyinBuild: addPinyin(line)
    }));

    // Extract novel ID and chapter ID from URL
    const urlMatch = url.match(/zhuishu\.com\/id(\d+)\/(\d+)\.html/);
    const novelId = urlMatch ? urlMatch[1] : null;
    const chapterId = urlMatch ? urlMatch[2] : null;

    res.json({ lines: annotated, totalLines: annotated.length, novelId, chapterId });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === Translate a single line ===
app.post('/api/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  try {
    const translation = await translateLine(text);
    res.json({ translation });
  } catch (err) {
    res.json({ translation: '' });
  }
});

// === Batch translate ===
app.post('/api/translate-batch', async (req, res) => {
  const { lines } = req.body;
  if (!lines || !lines.length) return res.status(400).json({ error: 'Lines required' });
  try {
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      const t = await translateLine(lines[i]);
      results.push(t);
      if (i < lines.length - 1) await sleep(300);
    }
    res.json({ translations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// === Fetch full chapter list for a novel by ID ===
async function fetchChapterList(novelId) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  const page = await context.newPage();

  try {
    await page.goto('https://www.zhuishu.com/id' + novelId + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    var chapters = [];
    // Click pagination links 2 and 3 to load all chapters
    for (var pg of ['2', '3']) {
      await page.evaluate((p) => {
        var links = document.querySelectorAll('a');
        for (var a of links) {
          if (a.textContent.trim() === p) { a.click(); return; }
        }
      }, pg);
      await page.waitForTimeout(2000);
    }

    chapters = await page.evaluate((id) => {
      return Array.from(document.querySelectorAll('a'))
        .filter(a => {
          var h = a.href || '';
          return h.includes('id' + id + '/') && h.endsWith('.html') && a.textContent.trim().length > 3;
        })
        .map(a => ({ url: a.href, title: a.textContent.trim() }))
        .filter((c, i, arr) => arr.findIndex(x => x.url === c.url) === i); // dedupe
    }, novelId);

    // Sort: put in order by URL suffix (numerical)
    chapters.sort((a, b) => {
      var na = parseInt(a.url.split('/').pop().replace('.html', ''));
      var nb = parseInt(b.url.split('/').pop().replace('.html', ''));
      return na - nb;
    });

    return chapters;
  } finally {
    await browser.close();
  }
}

// === Fetch chapter content via Playwright ===
async function fetchChapter(url) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);

    const content = await page.evaluate(() => {
      // Priority: try known content selectors
      const selectors = [
        '#content',
        '.content',
        '.chapter-content',
        '.read-content',
        '.txtnav',
        'article',
        '.novel-content',
        '#chaptercontent',
        '.chapter_content',
        '[class*="content"]',
        '[id*="content"]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim().length > 300) {
          return el.textContent.trim();
        }
      }

      // Fallback: all paragraphs
      const paragraphs = Array.from(document.querySelectorAll('p'));
      const pText = paragraphs
        .map(p => p.textContent.trim())
        .filter(t => t.length > 15 && t.length < 5000);
      if (pText.length > 3) return pText.join('\n');

      // Last resort: body text
      return document.body.innerText;
    });

    // Clean up: remove common junk text patterns
    const cleaned = cleanContent(content, url);
    return cleaned;
  } catch (err) {
    throw new Error('Failed to load page: ' + err.message);
  } finally {
    await browser.close();
  }
}

function cleanContent(text, url) {
  let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Remove site navigation and junk patterns
  const junkPatterns = [
    /^首页$/,
    /搜索/,
    /^上一章$/,
    /^下一章$/,
    /^目录$/,
    /^存书签$/,
    /^字体/,
    /^换手/,
    /^关灯/,
    /下一页/,
    /上一页/,
    /追看新章节/,
    /下载本站/,
    /无广告/,
    /^广告/,
    /本站所有收录/,
    /如有侵权/,
    /网站地图/,
    /^登录$/,
    /^注册$/,
    /^玄幻$/,
    /^武侠$/,
    /^都市$/,
    /^历史$/,
    /^网游$/,
    /^科幻$/,
    /^言情$/,
    /^其他$/,
    /^排行$/,
    /^完本$/,
    /^首页/,
    /追书网/,
    /^返回/,
    /^第\(\d+\/\d+\)页$/,
    /^第\(\d+\/\d+\)页\s*/,
    /\s*第\(\d+\/\d+\)页\s*/,
    /^\d+\/\d+$/,
    /超速首发/,
    /最新最快/,
    /无弹窗/,
  ];

  // Find where actual chapter content starts (skip everything before the first long line)
  let contentStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 50) {
      contentStart = i;
      break;
    }
  }

  // Filter out lines that are just NAV elements or site chrome
  let filtered = lines.slice(contentStart).filter(line => {
    for (const pat of junkPatterns) {
      if (pat.test(line)) return false;
    }
    // Remove lines starting with ~ (decorative separators on novel sites)
    if (/^[~～\s]+$/.test(line)) return false;
    // Remove lines that are just "第(1/3)页" embedded in text - clean inline too
    line = line.replace(/\(\s*\d+\s*\/\s*\d+\s*\)\s*页/g, '');
    line = line.replace(/[~～]{2,}/g, '');
    line = line.replace(/超速首发/g, '');
    line = line.trim();
    return line.length > 3;
  }).map(l => l.trim());

  // Stop at obvious end markers
  const endIdx = filtered.findIndex(l =>
    /^上一章/.test(l) || /^下一章/.test(l) || /追看新章节/.test(l)
  );
  if (endIdx > 3) filtered = filtered.slice(0, endIdx);

  return filtered.join('\n');
}

// === Pinyin annotation for a line ===
function addPinyin(text) {
  try {
    const chars = text.split('');
    return chars.map(c => {
      if (/[\u4e00-\u9fff]/.test(c)) {
        const py = pinyin(c, { toneType: 'symbol' });
        return { char: c, pinyin: py };
      }
      return { char: c, pinyin: '' };
    });
  } catch (e) {
    return text.split('').map(c => ({ char: c, pinyin: '' }));
  }
}

// === Translate via Google Translate (free, no key) ===
async function translateLine(text) {
  // Only translate if there's Chinese text
  if (!/[\u4e00-\u9fff]/.test(text)) return text;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text.slice(0, 500))}`;
  try {
    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!resp.ok) return '';
    const data = await resp.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return '';
  } catch (e) {
    return '';
  }
}

// === Split into sentences (by 。！？ newlines, or punctuation) ===
function splitIntoLines(text) {
  // First try splitting by common Chinese sentence endings
  const sentences = text
    .split(/(?<=[。！？\n])/)
    .map(l => l.trim())
    .filter(l => l.length > 5);

  if (sentences.length > 2) return sentences.slice(0, 300);

  // Fallback: newlines
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 5)
    .slice(0, 300);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aquarium reader running on http://0.0.0.0:${PORT}`);
});