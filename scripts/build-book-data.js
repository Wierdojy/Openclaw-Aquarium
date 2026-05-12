const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bookDir = path.join(root, "book");
const outputPath = path.join(root, "book-data.js");

const metadata = {
  "鬼吹灯_精绝古城.txt": {
    title: "鬼吹灯之精绝古城",
    author: "天下霸唱",
    color: "sage"
  }
};

const skipLines = new Set([
  "天涯书库",
  "首页",
  "华人文学",
  "世界文学",
  "校园青春",
  "都市生活",
  "网络文学",
  "恐怖",
  "推理",
  "科幻",
  "玄幻",
  "武侠",
  "言情",
  "作家",
  "当前位置:",
  "->",
  "->正文",
  "上一页",
  "下一页",
  "关于我们",
  "联系我们",
  "版权声明",
  "广告服务",
  "帮助中心",
  "友情链接",
  "免责声明",
  "网站声明",
  "使用帮助",
  "返回顶部",
  "章节目录",
  "目录",
  "正文",
  "上一章",
  "下一章",
  "申请链接",
  "网站地图",
  "设为首页",
  "加入收藏",
  " | ",
  "《鬼吹灯之精绝古城》"
]);

const skipPatterns = [
  /^[-=＿—_]{2,}$/,
  /^\|+$/,
  /^[|｜\s]+$/,
  /^当前位置/,
  /^作者[:：]/,
  /^来源[:：]/,
  /^发布时间[:：]/,
  /^更新时间[:：]/,
  /^本书来自/,
  /^更多.*小说/,
  /^请记住本书首发域名/,
  /^手机用户请浏览/,
  /^最新网址/,
  /^天涯书库/,
  /^Copyright\b/i,
  /^版权所有/,
  /^免责声明/,
  /^版权声明/,
  /^本站/,
  /^如果您喜欢/,
  /^推荐阅读/,
  /^热门推荐/,
  /^返回书页/,
  /^上一页$/,
  /^下一页$/,
  /^首页$/,
  /^-{3,}$/
];

function isNoiseLine(line) {
  const normalized = line.replace(/[|｜]/g, "").trim();
  return (
    !normalized ||
    skipLines.has(line) ||
    skipLines.has(normalized) ||
    skipPatterns.some((pattern) => pattern.test(line) || pattern.test(normalized))
  );
}

function cleanChapterText(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\u00a0/g, " ").replace(/[｜|]+/g, " ").replace(/\s+/g, " ").trim())
    .filter((line) => !isNoiseLine(line))
    .join("\n\n")
    .trim();
}

function parseChapters(source) {
  const text = source.replace(/\u00a0/g, " ");
  const chapterPattern = /^(引子|第[一二三四五六七八九十百千万0-9]+[章节回卷部].*)$/gm;
  const matches = [...text.matchAll(chapterPattern)];

  return matches
    .map((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? text.length;
      return {
        title: match[1].trim(),
        text: cleanChapterText(text.slice(start, end))
      };
    })
    .filter((chapter) => chapter.text);
}

function buildBook(fileName) {
  const filePath = path.join(bookDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const meta = metadata[fileName] ?? {
    title: path.basename(fileName, path.extname(fileName)),
    author: "Unknown",
    color: "sage"
  };

  return {
    title: meta.title,
    author: meta.author,
    progress: 0,
    color: meta.color,
    chapters: parseChapters(source)
  };
}

const books = fs
  .readdirSync(bookDir)
  .filter((fileName) => fileName.endsWith(".txt"))
  .sort((a, b) => a.localeCompare(b, "zh-CN"))
  .map(buildBook);

fs.writeFileSync(
  outputPath,
  `window.MUYU_BOOKS = ${JSON.stringify(books, null, 2)};\n`,
  "utf8"
);

for (const book of books) {
  console.log(`${book.title}: ${book.chapters.length} sections`);
}
