const starterBooks = [];
const removedSampleTitles = new Set(["山月记", "雪国", "瓦尔登湖", "局外人"]);
let activeAccountId = sessionStorage.getItem("muyu-session-user") || "";

const state = {
  books: loadBooks(),
  displayName: loadDisplayName(),
  language: loadLanguage(),
  readingStats: loadReadingStats(),
  bookProgress: loadBookProgress(),
  activeView: "home",
  readingTimer: null,
  currentBook: 0,
  currentChapter: 0,
  currentReaderText: "",
  dictionarySelection: null,
  tts: {
    supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    voices: [],
    voiceURI: loadTtsVoice(),
    rate: loadTtsRate(),
    chunks: [],
    chunkIndex: 0,
    chunkStart: 0,
    utterance: null,
    isPlaying: false,
    isPaused: false,
    requestedStop: false,
    charIndex: 0,
    statusKey: "ttsReady"
  }
};

function storageKey(key) {
  return activeAccountId ? `muyu-user:${activeAccountId}:${key}` : `muyu-${key}`;
}

const translations = {
  zh: {
    greetingMorning: "早安",
    greetingAfternoon: "下午好",
    greetingEvening: "晚上好",
    greetingNight: "夜深了",
    tabHome: "今日",
    tabLibrary: "书架",
    tabReader: "阅读",
    continueReading: "继续阅读",
    lastReading: "上次读到：",
    rhythmTitle: "阅读律动",
    rhythmSubtitle: "本周 {minutes} 分钟阅读",
    todayPill: "今天 {minutes} 分钟",
    minuteUnit: "分钟",
    weekDays: ["一", "二", "三", "四", "五", "六", "日"],
    recentTitle: "近期阅读",
    recentSubtitle: "轻轻接回上次的节奏",
    libraryTitle: "我的书架",
    booksUnit: "本书",
    chaptersUnit: "章",
    profileCaption: "个人资料",
    displayName: "显示名称",
    saveName: "保存名称",
    search: "搜索",
    profile: "个人资料",
    back: "返回",
    authCreateMode: "创建账户",
    authLoginMode: "登录",
    authCaption: "沐浴读书",
    authCreateTitle: "创建沐浴读书账户",
    authLoginTitle: "登录沐浴读书",
    authCreateSubmit: "创建账户",
    authLoginSubmit: "登录",
    authLoginToggle: "已有账户？登录",
    authCreateToggle: "新用户？创建账户",
    authUsername: "用户名",
    authMissing: "请输入用户名和 PIN",
    authExists: "这个用户名已经存在",
    authBadLogin: "用户名或 PIN 不正确",
    ttsIdle: "准备朗读",
    ttsReady: "准备朗读",
    ttsTitle: "朗读",
    ttsPlaying: "正在朗读",
    ttsPaused: "已暂停",
    ttsStopped: "已停止",
    ttsDone: "本章朗读完成",
    ttsUnsupported: "此浏览器不支持朗读",
    ttsVoiceLoading: "正在载入声音",
    ttsVoiceFallback: "浏览器默认声音",
    ttsVoice: "声音",
    ttsRate: "速度",
    ttsPlay: "朗读",
    ttsPause: "暂停朗读",
    ttsStop: "停止朗读",
    ttsBack: "后退 100 字",
    ttsForward: "前进 100 字",
    ttsSlower: "慢一点",
    ttsFaster: "快一点",
    ttsJumpLabel: "跳到字",
    unknownPinyin: "未收录",
    unknownMeaning: "No local definition yet",
    languageToggle: "EN"
  },
  en: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    greetingNight: "Quiet night",
    tabHome: "Today",
    tabLibrary: "Library",
    tabReader: "Reader",
    continueReading: "Continue",
    lastReading: "You were last reading:",
    rhythmTitle: "Reading Rhythm",
    rhythmSubtitle: "{minutes} min read this week",
    todayPill: "Today {minutes} min",
    minuteUnit: "min",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    recentTitle: "Recent Reads",
    recentSubtitle: "Ease back into your pace",
    libraryTitle: "My Library",
    booksUnit: "books",
    chaptersUnit: "chapters",
    profileCaption: "Profile",
    displayName: "Display name",
    saveName: "Save Name",
    search: "Search",
    profile: "Profile",
    back: "Back",
    authCreateMode: "Create account",
    authLoginMode: "Log in",
    authCaption: "Muyu Reader",
    authCreateTitle: "Create a Muyu account",
    authLoginTitle: "Log in to Muyu",
    authCreateSubmit: "Create account",
    authLoginSubmit: "Log in",
    authLoginToggle: "Already have one? Log in",
    authCreateToggle: "New here? Create account",
    authUsername: "Username",
    authMissing: "Enter a username and PIN",
    authExists: "That username already exists",
    authBadLogin: "Username or PIN is incorrect",
    ttsIdle: "Ready to read",
    ttsReady: "Ready to read",
    ttsTitle: "Read aloud",
    ttsPlaying: "Reading aloud",
    ttsPaused: "Paused",
    ttsStopped: "Stopped",
    ttsDone: "Chapter finished",
    ttsUnsupported: "Speech is not supported in this browser",
    ttsVoiceLoading: "Loading voices",
    ttsVoiceFallback: "Browser default voice",
    ttsVoice: "Voice",
    ttsRate: "Speed",
    ttsPlay: "Read aloud",
    ttsPause: "Pause reading",
    ttsStop: "Stop reading",
    ttsBack: "Back 100 characters",
    ttsForward: "Forward 100 characters",
    ttsSlower: "Slower",
    ttsFaster: "Faster",
    ttsJumpLabel: "Go to character",
    unknownPinyin: "Not saved",
    unknownMeaning: "No local definition yet",
    languageToggle: "中"
  }
};

const customDictionary = {
  鬼吹灯: ["gui3 chui1 deng1", "Ghost Blows Out the Light"],
  精绝古城: ["jing1 jue2 gu3 cheng2", "Jingjue Ancient City"],
  胡八一: ["hu2 ba1 yi1", "Hu Bayi"],
  王胖子: ["wang2 pang4 zi", "Wang Pangzi"],
  Shirley杨: ["Shirley yang2", "Shirley Yang"],
  风穿过林: ["feng1 chuan1 guo4 lin2", "the wind passes through the forest"],
  一轮明月: ["yi1 lun2 ming2 yue4", "a bright full moon"],
  看见过去: ["kan4 jian4 guo4 qu4", "to see the past"],
  一声回响: ["yi1 sheng1 hui2 xiang3", "an echo"]
};

const characterDictionary = Object.assign({}, window.MUYU_DICTIONARY || {}, customDictionary);
const dictionaryTermsByFirstChar = Object.keys(characterDictionary).reduce((groups, term) => {
  const firstChar = term[0];
  if (!groups[firstChar]) groups[firstChar] = [];
  groups[firstChar].push(term);
  return groups;
}, {});

Object.keys(dictionaryTermsByFirstChar).forEach((firstChar) => {
  dictionaryTermsByFirstChar[firstChar].sort((a, b) => b.length - a.length);
});
const maxDictionaryTermLength = Math.min(
  12,
  Object.keys(characterDictionary).reduce((longest, term) => Math.max(longest, term.length), 1)
);

function isChineseCharacter(char) {
  if (!char) return false;
  const code = char.codePointAt(0);
  return (
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0x20000 && code <= 0x2ebef)
  );
}

function loadBooks() {
  const bundledBooks = Array.isArray(window.MUYU_BOOKS) ? window.MUYU_BOOKS : [];
  const saved = localStorage.getItem(storageKey("books"));
  if (!saved) return applySavedBookProgress(bundledBooks.concat(starterBooks));
  try {
    const savedBooks = JSON.parse(saved);
    const bundledTitles = new Set(bundledBooks.map((book) => book.title));
    const savedUserBooks = savedBooks.filter((book) => !bundledTitles.has(book.title) && !removedSampleTitles.has(book.title));
    if (savedUserBooks.length !== savedBooks.length) {
      localStorage.setItem(storageKey("books"), JSON.stringify(savedUserBooks));
    }
    const savedTitles = new Set(savedUserBooks.map((book) => book.title));
    const newBundledBooks = bundledBooks.filter((book) => !savedTitles.has(book.title));
    return applySavedBookProgress(newBundledBooks.concat(savedUserBooks));
  } catch (error) {
    return applySavedBookProgress(bundledBooks.concat(starterBooks));
  }
}

function saveBooks() {
  const bundledTitles = new Set((window.MUYU_BOOKS || []).concat(starterBooks).map((book) => book.title));
  const userBooks = state.books.filter((book) => !bundledTitles.has(book.title) && !removedSampleTitles.has(book.title));
  localStorage.setItem(storageKey("books"), JSON.stringify(userBooks));
}

function loadDisplayName() {
  return localStorage.getItem(storageKey("display-name")) || "袁孝正";
}

function saveDisplayName() {
  localStorage.setItem(storageKey("display-name"), state.displayName);
}

function loadLanguage() {
  return localStorage.getItem(storageKey("language")) || "zh";
}

function saveLanguage() {
  localStorage.setItem(storageKey("language"), state.language);
}

function loadReadingStats() {
  const saved = localStorage.getItem(storageKey("reading-stats"));
  if (!saved) return {};
  try {
    const parsed = JSON.parse(saved);
    const parsedValues = Object.keys(parsed).map((key) => parsed[key]);
    if (parsedValues.some((value) => typeof value === "number")) {
      const sourceBooks = window.MUYU_BOOKS || [];
      const firstBookTitle = sourceBooks.length ? sourceBooks[0].title : "book";
      return { [firstBookTitle]: parsed };
    }
    return parsed;
  } catch (error) {
    return {};
  }
}

function saveReadingStats() {
  localStorage.setItem(storageKey("reading-stats"), JSON.stringify(state.readingStats));
}

function loadBookProgress() {
  const saved = localStorage.getItem(storageKey("book-progress"));
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch (error) {
    return {};
  }
}

function saveBookProgress() {
  localStorage.setItem(storageKey("book-progress"), JSON.stringify(state.bookProgress));
}

function loadTtsVoice() {
  return localStorage.getItem(storageKey("tts-voice")) || "";
}

function saveTtsVoice() {
  localStorage.setItem(storageKey("tts-voice"), state.tts.voiceURI);
}

function loadTtsRate() {
  const saved = Number(localStorage.getItem(storageKey("tts-rate")));
  return Number.isFinite(saved) && saved >= 0.6 && saved <= 1.8 ? saved : 1;
}

function saveTtsRate() {
  localStorage.setItem(storageKey("tts-rate"), String(state.tts.rate));
}

function normalizeAccountName(name) {
  return name.trim().toLowerCase();
}

function loadAccounts() {
  const saved = localStorage.getItem("muyu-accounts");
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch (error) {
    return {};
  }
}

function saveAccounts(accounts) {
  localStorage.setItem("muyu-accounts", JSON.stringify(accounts));
}

function hasAccounts() {
  return Object.keys(loadAccounts()).length > 0;
}

function setAuthMode(mode) {
  const isCreate = mode === "create";
  document.querySelector("#authModeLabel").textContent = t("authCaption");
  document.querySelector("#authTitle").textContent = t(isCreate ? "authCreateTitle" : "authLoginTitle");
  document.querySelector("#authSubmit").textContent = t(isCreate ? "authCreateSubmit" : "authLoginSubmit");
  document.querySelector("#authModeToggle").textContent = t(isCreate ? "authLoginToggle" : "authCreateToggle");
  document.querySelector("#authForm").dataset.mode = mode;
}

function showAuth(message = "") {
  stopTts("ttsIdle");
  syncReadingTimer();
  document.body.classList.add("auth-locked");
  document.querySelector("#authOverlay").hidden = false;
  setAuthMode(hasAccounts() ? "login" : "create");
  const error = document.querySelector("#authError");
  error.textContent = message;
  error.hidden = !message;
}

function unlockApp(accountId) {
  activeAccountId = accountId;
  sessionStorage.setItem("muyu-session-user", accountId);
  document.body.classList.remove("auth-locked");
  document.querySelector("#authOverlay").hidden = true;
  loadAccountState();
  setDateLabel();
  renderAll();
}

function loadAccountState() {
  const accounts = loadAccounts();
  const account = accounts[activeAccountId];
  state.books = loadBooks();
  state.displayName = loadDisplayName();
  if (account && account.displayName && state.displayName === "袁孝正") {
    state.displayName = account.displayName;
    saveDisplayName();
  }
  state.language = loadLanguage();
  state.readingStats = loadReadingStats();
  state.bookProgress = loadBookProgress();
  state.currentBook = 0;
  state.currentChapter = 0;
  state.currentReaderText = "";
  state.dictionarySelection = null;
  state.tts.voiceURI = loadTtsVoice();
  state.tts.rate = loadTtsRate();
  state.tts.charIndex = 0;
  state.tts.statusKey = "ttsReady";
}

function createAccount(name, pin) {
  const accountId = normalizeAccountName(name);
  const accounts = loadAccounts();
  if (!accountId || !pin) return t("authMissing");
  if (accounts[accountId]) return t("authExists");
  accounts[accountId] = {
    displayName: name.trim(),
    pin
  };
  saveAccounts(accounts);
  activeAccountId = accountId;
  localStorage.setItem(storageKey("display-name"), name.trim());
  unlockApp(accountId);
  return "";
}

function loginAccount(name, pin) {
  const accountId = normalizeAccountName(name);
  const accounts = loadAccounts();
  if (!accounts[accountId] || accounts[accountId].pin !== pin) return t("authBadLogin");
  unlockApp(accountId);
  return "";
}

function applySavedBookProgress(books) {
  const progress = loadBookProgress();
  return books.map((book) => {
    const savedProgress = progress[book.title];
    return Object.assign({}, book, {
      progress: savedProgress && typeof savedProgress.progress === "number" ? savedProgress.progress : book.progress || 0
    });
  });
}

function t(key) {
  return translations[state.language][key] || translations.zh[key] || key;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const monthValue = String(date.getMonth() + 1);
  const dayValue = String(date.getDate());
  const month = monthValue.length === 1 ? `0${monthValue}` : monthValue;
  const day = dayValue.length === 1 ? `0${dayValue}` : dayValue;
  return `${year}-${month}-${day}`;
}

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 5) return "greetingNight";
  if (hour < 12) return "greetingMorning";
  if (hour < 18) return "greetingAfternoon";
  if (hour < 22) return "greetingEvening";
  return "greetingNight";
}

function getWeekDates() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - mondayOffset);
  const dates = [];
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    dates.push(date);
  }
  return dates;
}

function getCurrentBook() {
  return state.books[state.currentBook];
}

function getCurrentBookTitle() {
  const book = getCurrentBook();
  return book ? book.title : "book";
}

function getBookReadingStats(bookTitle = getCurrentBookTitle()) {
  if (!state.readingStats[bookTitle]) state.readingStats[bookTitle] = {};
  return state.readingStats[bookTitle];
}

function getDaySeconds(date, bookTitle = getCurrentBookTitle()) {
  return getBookReadingStats(bookTitle)[formatDateKey(date)] || 0;
}

function formatMinutes(seconds) {
  return Math.floor(seconds / 60);
}

function setDateLabel() {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long"
  });
  document.querySelector("#dateLabel").textContent = formatter.format(new Date());
}

function updateProfile() {
  const initial = state.displayName.trim().charAt(0) || "袁";
  document.querySelector("#greetingLabel").textContent = `${t(getGreetingKey())}，${state.displayName}`;
  document.querySelector("#avatarButton").textContent = initial;
  document.querySelector("#profileAvatar").textContent = initial;
  document.querySelector("#profileNameLabel").textContent = state.displayName;
  document.querySelector("#displayNameInput").value = state.displayName;
}

function renderReadingRhythm() {
  const dates = getWeekDates();
  const bookTitle = getCurrentBookTitle();
  const secondsByDay = dates.map((date) => getDaySeconds(date, bookTitle));
  const totalSeconds = secondsByDay.reduce((sum, seconds) => sum + seconds, 0);
  const todayKey = formatDateKey(new Date());
  const maxSeconds = secondsByDay.reduce((largest, seconds) => Math.max(largest, seconds), 60);
  const weekLabels = t("weekDays");
  const chart = document.querySelector("#readingChart");
  const weekRow = document.querySelector("#weekRow");
  chart.innerHTML = "";
  weekRow.innerHTML = "";
  dates.forEach((date, index) => {
    const seconds = secondsByDay[index];
    const bar = document.createElement("span");
    const height = Math.max(18, Math.round((seconds / maxSeconds) * 64));
    bar.style.height = `${height}px`;
    bar.title = `${weekLabels[index]} · ${formatMinutes(seconds)} ${t("minuteUnit")}`;
    if (formatDateKey(date) === todayKey) bar.classList.add("today");
    if (seconds === 0) bar.classList.add("dim");
    chart.append(bar);

    const label = document.createElement("span");
    label.textContent = weekLabels[index];
    weekRow.append(label);
  });
  document.querySelector("#rhythmSubtitle").textContent = t("rhythmSubtitle").replace("{minutes}", formatMinutes(totalSeconds));
  document.querySelector("#todayReadingPill").textContent = t("todayPill").replace("{minutes}", formatMinutes(getDaySeconds(new Date(), bookTitle)));
}

function applyLanguage() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });
  document.querySelector("#languageToggle").textContent = t("languageToggle");
  document.querySelector("#authLanguageToggle").textContent = t("languageToggle");
  setAuthMode(document.querySelector("#authForm").dataset.mode || (hasAccounts() ? "login" : "create"));
  updateProfile();
  updateTtsUi();
  renderLibrary();
  renderReadingRhythm();
}

function coverClass(index) {
  const coverPalette = ["blue", "terra", "sage", "mist"];
  return coverPalette[index % coverPalette.length];
}

function renderHomeBooks() {
  const homeBooks = document.querySelector("#homeBooks");
  homeBooks.innerHTML = "";
  state.books.slice(0, 3).forEach((book, index) => {
    const button = document.createElement("button");
    button.className = "book-card";
    button.type = "button";
    button.innerHTML = `
      <div class="cover ${coverClass(index)}"></div>
      <strong>${book.title}</strong>
      <span>${book.author}</span>
      <span>${book.progress || 0}%</span>
    `;
    button.addEventListener("click", () => openBook(index));
    homeBooks.append(button);
  });
}

function renderLibrary() {
  document.querySelector("#libraryCount").textContent = `${state.books.length} ${t("booksUnit")}`;
  const list = document.querySelector("#libraryList");
  list.innerHTML = "";
  state.books.forEach((book, index) => {
    const button = document.createElement("button");
    button.className = "library-card";
    button.type = "button";
    button.innerHTML = `
      <div class="cover ${coverClass(index)}"></div>
      <div>
        <strong>${book.title}</strong>
        <span>${book.author}</span>
        <span>${book.chapters.length} ${t("chaptersUnit")} · ${book.progress || 0}%</span>
      </div>
    `;
    button.addEventListener("click", () => openBook(index));
    list.append(button);
  });
}

function renderInteractiveText(text) {
  const container = document.querySelector("#readerText");
  container.innerHTML = "";
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (isChineseCharacter(char)) {
      const button = document.createElement("button");
      button.className = "reader-term";
      button.type = "button";
      button.textContent = char;
      button.dataset.char = char;
      button.dataset.index = String(index);
      container.append(button);
    } else {
      container.append(document.createTextNode(char));
    }
    index += 1;
  }
}

function getBookProgress(bookIndex = state.currentBook) {
  const book = state.books[bookIndex];
  if (!book || !book.chapters.length) return 0;
  return Math.round((state.currentChapter / book.chapters.length) * 100);
}

function getChapterFlavorText(chapter) {
  const titlePattern = /^(引子|第[一二三四五六七八九十百千万0-9]+[章节回卷部].*)$/;
  const lines = chapter.text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && line !== chapter.title && !titlePattern.test(line));
  const flavor = lines.find((line) => line.length >= 12) || lines[0] || "";
  return flavor.length > 58 ? `${flavor.slice(0, 58)}……` : flavor;
}

function getReaderBodyText(chapter) {
  const titlePattern = /^(引子|第[一二三四五六七八九十百千万0-9]+[章节回卷部].*)$/;
  const lines = chapter.text.split("\n");
  while (lines.length) {
    const line = lines[0].trim();
    if (!line || line === chapter.title || titlePattern.test(line)) {
      lines.shift();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

function renderReader() {
  const book = state.books[state.currentBook];
  const chapter = book.chapters[state.currentChapter];
  const readerText = getReaderBodyText(chapter);
  const progress = getBookProgress();
  book.progress = progress;
  state.bookProgress[book.title] = {
    chapter: state.currentChapter,
    progress
  };
  saveBookProgress();
  document.querySelector("#readerBook").textContent = book.title;
  document.querySelector("#readerChapter").textContent = chapter.title;
  state.currentReaderText = readerText;
  renderInteractiveText(readerText);
  hideDefinition();
  document.querySelector("#chapterProgress").textContent = `${state.currentChapter + 1} / ${book.chapters.length}`;
  document.querySelector("#currentTitle").textContent = book.title;
  document.querySelector("#currentChapter").textContent = `${chapter.title} · ${progress}%`;
  document.querySelector("#currentExcerpt").textContent = getChapterFlavorText(chapter);
  document.querySelector("#currentProgressFill").style.width = `${progress}%`;
  document.querySelector("#currentProgressPath").setAttribute("aria-label", `阅读进度 ${progress}%`);
  renderHomeBooks();
  renderLibrary();
  updateChapterControls();
  updateTtsUi();
}

function normalizeTtsText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function chunkTtsText(text) {
  if (!normalizeTtsText(text)) return [];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    while (start < text.length && /\s/.test(text[start])) start += 1;
    if (start >= text.length) break;

    let end = Math.min(text.length, start + 220);
    const minimumEnd = Math.min(text.length, start + 80);
    for (let index = minimumEnd; index < end; index += 1) {
      if (/[。！？!?；;，,、\n]/.test(text[index])) {
        end = index + 1;
        break;
      }
    }
    chunks.push({ text: text.slice(start, end), start, end });
    start = end;
  }
  return chunks;
}

function getVoiceKey(voice) {
  return voice.voiceURI || `${voice.name}-${voice.lang}`;
}

function getPreferredVoice(voices) {
  if (!voices.length) return null;
  const savedVoice = voices.find((voice) => getVoiceKey(voice) === state.tts.voiceURI);
  if (savedVoice) return savedVoice;
  return (
    voices.find((voice) => /^zh-(CN|Hans)/i.test(voice.lang)) ||
    voices.find((voice) => /^zh/i.test(voice.lang)) ||
    voices[0]
  );
}

function populateTtsVoices() {
  if (!state.tts.supported) {
    updateTtsUi();
    return;
  }
  const voices = window.speechSynthesis.getVoices();
  state.tts.voices = voices.slice().sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
  const preferredVoice = getPreferredVoice(state.tts.voices);
  if (preferredVoice && !state.tts.voiceURI) {
    state.tts.voiceURI = getVoiceKey(preferredVoice);
    saveTtsVoice();
  }
  updateTtsUi();
}

function getSelectedTtsVoice() {
  return state.tts.voices.find((voice) => getVoiceKey(voice) === state.tts.voiceURI) || getPreferredVoice(state.tts.voices);
}

function setTtsStatus(statusKey) {
  state.tts.statusKey = statusKey;
  updateTtsUi();
}

function updateTtsUi() {
  const panel = document.querySelector("#ttsPanel");
  if (!panel) return;
  const toggle = document.querySelector("#ttsToggle");
  const stop = document.querySelector("#ttsStop");
  const status = document.querySelector("#ttsStatus");
  const back = document.querySelector("#ttsBack");
  const forward = document.querySelector("#ttsForward");
  const slower = document.querySelector("#ttsSlower");
  const faster = document.querySelector("#ttsFaster");
  const jumpInput = document.querySelector("#ttsJumpInput");
  const rateLabel = document.querySelector("#ttsRateLabel");
  const progressFill = document.querySelector("#ttsProgressFill");
  toggle.classList.toggle("is-playing", state.tts.isPlaying && !state.tts.isPaused);
  toggle.classList.toggle("tts-play-button", true);
  toggle.setAttribute("aria-label", state.tts.isPlaying && !state.tts.isPaused ? t("ttsPause") : t("ttsPlay"));
  stop.setAttribute("aria-label", t("ttsStop"));
  status.textContent = state.tts.supported ? t(state.tts.statusKey) : t("ttsUnsupported");
  if (rateLabel) rateLabel.textContent = `${state.tts.rate.toFixed(2).replace(/0$/, "")}x`;
  if (jumpInput) {
    jumpInput.max = String(Math.max(state.currentReaderText.length, 1));
    jumpInput.value = String(Math.min(state.tts.charIndex + 1, Number(jumpInput.max)));
    jumpInput.disabled = !state.tts.supported;
  }
  if (progressFill) {
    const total = Math.max(state.currentReaderText.length, 1);
    progressFill.style.width = `${Math.min(100, Math.round((state.tts.charIndex / total) * 100))}%`;
  }
  toggle.disabled = !state.tts.supported;
  stop.disabled = !state.tts.supported || (!state.tts.isPlaying && !state.tts.isPaused);
  [back, forward, slower, faster].forEach((button) => {
    if (button) button.disabled = !state.tts.supported;
  });
}

function clearTtsHighlight() {
  document.querySelectorAll(".reader-term.speaking").forEach((node) => {
    node.classList.remove("speaking");
  });
}

function highlightTtsCharacter(index) {
  clearTtsHighlight();
  let target = getReaderTermAt(index);
  for (let offset = 1; !target && offset < 8; offset += 1) {
    target = getReaderTermAt(index + offset);
  }
  if (target) target.classList.add("speaking");
}

function setTtsCharacterIndex(index, shouldScroll = false) {
  const maxIndex = Math.max(0, state.currentReaderText.length - 1);
  state.tts.charIndex = Math.min(Math.max(0, index), maxIndex);
  highlightTtsCharacter(state.tts.charIndex);
  updateTtsUi();
  if (shouldScroll) {
    const target = getReaderTermAt(state.tts.charIndex);
    if (target) target.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function speakNextTtsChunk() {
  if (!state.tts.supported || state.tts.requestedStop) return;
  const chunk = state.tts.chunks[state.tts.chunkIndex];
  if (!chunk) {
    state.tts.isPlaying = false;
    state.tts.isPaused = false;
    state.tts.chunkIndex = 0;
    setTtsCharacterIndex(Math.max(0, state.currentReaderText.length - 1), false);
    setTtsStatus("ttsDone");
    return;
  }

  const chunkOffset = state.tts.charIndex > chunk.start && state.tts.charIndex < chunk.end ? state.tts.charIndex - chunk.start : 0;
  const utterance = new SpeechSynthesisUtterance(chunk.text.slice(chunkOffset));
  const voice = getSelectedTtsVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice ? voice.lang : "zh-CN";
  utterance.rate = state.tts.rate;
  utterance.pitch = 1;
  utterance.onboundary = (event) => {
    if (typeof event.charIndex === "number") {
      setTtsCharacterIndex(chunk.start + chunkOffset + event.charIndex, false);
    }
  };
  utterance.onend = () => {
    if (state.tts.requestedStop) return;
    setTtsCharacterIndex(chunk.end, false);
    state.tts.chunkIndex += 1;
    speakNextTtsChunk();
  };
  utterance.onerror = () => {
    state.tts.isPlaying = false;
    state.tts.isPaused = false;
    setTtsStatus("ttsStopped");
  };
  window.speechSynthesis.speak(utterance);
}

function startTts(startIndex = state.tts.charIndex) {
  if (!state.tts.supported) return;
  const chunks = chunkTtsText(state.currentReaderText);
  if (!chunks.length) return;
  window.speechSynthesis.cancel();
  state.tts.chunks = chunks;
  state.tts.charIndex = Math.max(0, Math.min(startIndex, state.currentReaderText.length - 1));
  state.tts.chunkIndex = Math.max(
    0,
    chunks.findIndex((chunk) => state.tts.charIndex >= chunk.start && state.tts.charIndex < chunk.end)
  );
  state.tts.isPlaying = true;
  state.tts.isPaused = false;
  state.tts.requestedStop = false;
  setTtsStatus("ttsPlaying");
  speakNextTtsChunk();
}

function toggleTts() {
  if (!state.tts.supported) return;
  if (state.tts.isPlaying && !state.tts.isPaused) {
    window.speechSynthesis.pause();
    state.tts.isPaused = true;
    setTtsStatus("ttsPaused");
    return;
  }
  if (state.tts.isPlaying && state.tts.isPaused) {
    window.speechSynthesis.resume();
    state.tts.isPaused = false;
    setTtsStatus("ttsPlaying");
    return;
  }
  startTts();
}

function stopTts(statusKey = "ttsStopped") {
  if (!state.tts.supported) return;
  state.tts.requestedStop = true;
  window.speechSynthesis.cancel();
  state.tts.chunks = [];
  state.tts.chunkIndex = 0;
  state.tts.charIndex = 0;
  state.tts.isPlaying = false;
  state.tts.isPaused = false;
  clearTtsHighlight();
  setTtsStatus(statusKey);
}

function restartTtsFrom(charIndex) {
  const wasActive = state.tts.isPlaying || state.tts.isPaused;
  stopTts("ttsIdle");
  setTtsCharacterIndex(charIndex, !wasActive);
  if (wasActive) startTts(state.tts.charIndex);
}

function nudgeTtsCharacterOffset(amount) {
  restartTtsFrom(state.tts.charIndex + amount);
}

function setTtsRate(rate) {
  state.tts.rate = Math.max(0.6, Math.min(1.8, rate));
  saveTtsRate();
  if (state.tts.isPlaying || state.tts.isPaused) startTts(state.tts.charIndex);
  updateTtsUi();
}

const toneMarks = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  v: ["ǖ", "ǘ", "ǚ", "ǜ"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
  A: ["Ā", "Á", "Ǎ", "À"],
  E: ["Ē", "É", "Ě", "È"],
  I: ["Ī", "Í", "Ǐ", "Ì"],
  O: ["Ō", "Ó", "Ǒ", "Ò"],
  U: ["Ū", "Ú", "Ǔ", "Ù"],
  V: ["Ǖ", "Ǘ", "Ǚ", "Ǜ"],
  Ü: ["Ǖ", "Ǘ", "Ǚ", "Ǜ"]
};

function markPinyinSyllable(syllable) {
  const toneMatch = syllable.match(/([1-5])$/);
  if (!toneMatch) return syllable.replace(/u:/g, "ü").replace(/v/g, "ü");
  const tone = Number(toneMatch[1]);
  let base = syllable.slice(0, -1).replace(/u:/g, "ü").replace(/v/g, "ü");
  if (tone === 5) return base;

  const lowerBase = base.toLowerCase();
  let markIndex = -1;
  for (const vowel of ["a", "e", "ou"]) {
    const index = lowerBase.indexOf(vowel);
    if (index !== -1) {
      markIndex = index;
      break;
    }
  }
  if (markIndex === -1) {
    markIndex = Math.max(base.search(/[aeiouüAEIOUÜ][^aeiouüAEIOUÜ]*$/), 0);
  }
  const vowel = base[markIndex];
  const marked = toneMarks[vowel] ? toneMarks[vowel][tone - 1] : undefined;
  if (!marked) return base;
  return `${base.slice(0, markIndex)}${marked}${base.slice(markIndex + 1)}`;
}

function formatPinyin(pinyin) {
  return pinyin
    .split(/(\s+|-)/)
    .map((part) => (/[\s-]+/.test(part) ? part : markPinyinSyllable(part)))
    .join("");
}

function getDictionaryMatchAt(text, selectedIndex) {
  let bestMatch = null;
  const minStart = Math.max(0, selectedIndex - maxDictionaryTermLength + 1);
  for (let start = selectedIndex; start >= minStart; start -= 1) {
    const firstChar = text[start];
    const terms = dictionaryTermsByFirstChar[firstChar] || [];
    const remaining = text.slice(start);
    const term = terms.find((entry) => selectedIndex < start + entry.length && remaining.startsWith(entry));
    if (!term) continue;
    if (!bestMatch || term.length > bestMatch.term.length || (term.length === bestMatch.term.length && start < bestMatch.start)) {
      bestMatch = { term, start };
    }
  }
  return bestMatch;
}

function getReaderTermAt(index) {
  return document.querySelector(`#readerText .reader-term[data-index="${index}"]`);
}

function getActiveTargets(start, length) {
  const targets = [];
  for (let offset = 0; offset < length; offset += 1) {
    const target = getReaderTermAt(start + offset);
    if (target) targets.push(target);
  }
  return targets;
}

function clearActiveReaderTerms() {
  document.querySelectorAll(".reader-term.active").forEach((node) => {
    node.classList.remove("active", "active-start", "active-end");
  });
}

function showDefinition(anchor, term, activeTargets) {
  const [pinyin, meaning] = characterDictionary[term] || [t("unknownPinyin"), t("unknownMeaning")];
  const popover = document.querySelector("#definitionPopover");
  const audioIndex = activeTargets.length ? Number(activeTargets[0].dataset.index) : Number(anchor.dataset.index);
  clearActiveReaderTerms();
  activeTargets.forEach((node, index) => {
    node.classList.add("active");
    if (index === 0) node.classList.add("active-start");
    if (index === activeTargets.length - 1) node.classList.add("active-end");
  });
  document.querySelector("#definitionChar").textContent = term;
  document.querySelector("#definitionPinyin").textContent = formatPinyin(pinyin);
  document.querySelector("#definitionMeaning").textContent = meaning;
  if (state.dictionarySelection) state.dictionarySelection.audioIndex = audioIndex;
  popover.hidden = false;
  positionDefinitionPopover(anchor, popover);
}

function showDictionaryForTarget(target) {
  const selectedIndex = Number(target.dataset.index);
  const match = getDictionaryMatchAt(state.currentReaderText, selectedIndex);
  const shouldShowCharacter =
    match &&
    match.term.length > 1 &&
    state.dictionarySelection &&
    state.dictionarySelection.index === selectedIndex &&
    state.dictionarySelection.mode === "phrase";

  if (shouldShowCharacter || !match) {
    state.dictionarySelection = { index: selectedIndex, mode: "character", term: target.dataset.char };
    showDefinition(target, target.dataset.char, [target]);
    return;
  }

  state.dictionarySelection = { index: selectedIndex, mode: "phrase", term: match.term };
  showDefinition(target, match.term, getActiveTargets(match.start, match.term.length));
}

function hideDefinition() {
  state.dictionarySelection = null;
  clearActiveReaderTerms();
  document.querySelector("#definitionPopover").hidden = true;
}

function positionDefinitionPopover(target, popover) {
  const targetRect = target.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const viewportPadding = 12;
  const gap = 10;
  const centeredLeft = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
  const left = Math.min(
    Math.max(viewportPadding, centeredLeft),
    window.innerWidth - popoverRect.width - viewportPadding
  );
  const aboveTop = targetRect.top - popoverRect.height - gap;
  const belowTop = targetRect.bottom + gap;
  const top = aboveTop >= viewportPadding ? aboveTop : Math.min(belowTop, window.innerHeight - popoverRect.height - viewportPadding);

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.classList.toggle("below", aboveTop < viewportPadding);
}

function recordReadingSecond() {
  const today = formatDateKey(new Date());
  const stats = getBookReadingStats();
  stats[today] = (stats[today] || 0) + 1;
  if (stats[today] % 5 === 0) saveReadingStats();
  renderReadingRhythm();
}

function syncReadingTimer() {
  const shouldTrack = state.activeView === "reader" && !document.hidden;
  if (shouldTrack && !state.readingTimer) {
    state.readingTimer = window.setInterval(recordReadingSecond, 1000);
    return;
  }
  if (!shouldTrack && state.readingTimer) {
    window.clearInterval(state.readingTimer);
    state.readingTimer = null;
    saveReadingStats();
  }
}

function setView(viewName) {
  if (state.activeView === "reader" && viewName !== "reader") {
    stopTts("ttsIdle");
  }
  state.activeView = viewName;
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${viewName}View`).classList.add("active");
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  syncReadingTimer();
}

function openBook(index) {
  state.currentBook = index;
  const savedProgress = state.bookProgress[state.books[index].title];
  const savedChapter = savedProgress && typeof savedProgress.chapter === "number" ? savedProgress.chapter : 0;
  state.currentChapter = Math.min(savedChapter, state.books[index].chapters.length - 1);
  renderReader();
  setView("reader");
}

function updateChapterControls() {
  const book = state.books[state.currentBook];
  const progressText = `${state.currentChapter + 1} / ${book.chapters.length}`;
  document.querySelectorAll("[data-chapter-progress]").forEach((node) => {
    node.textContent = progressText;
  });
  document.querySelectorAll('[data-chapter-action="prev"]').forEach((button) => {
    button.disabled = state.currentChapter <= 0;
  });
  document.querySelectorAll('[data-chapter-action="next"]').forEach((button) => {
    button.disabled = state.currentChapter >= book.chapters.length - 1;
  });
}

function changeChapter(direction) {
  const book = state.books[state.currentBook];
  const nextChapter = state.currentChapter + direction;
  if (nextChapter < 0 || nextChapter >= book.chapters.length) return;
  stopTts("ttsIdle");
  state.currentChapter = nextChapter;
  renderReader();
  hideDefinition();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function parseChapters(rawText) {
  const text = rawText.trim();
  const parts = text.split(/\n(?=第[一二三四五六七八九十百千万\d]+[章节回卷部].*)/g).filter(Boolean);
  if (parts.length <= 1) return [{ title: "第一章", text }];
  return parts.map((part, index) => {
    const lines = part.trim().split("\n");
    const first = lines[0].trim();
    const hasTitle = /^第[一二三四五六七八九十百千万\d]+[章节回卷部]/.test(first);
    return {
      title: hasTitle ? first : `第${index + 1}章`,
      text: hasTitle ? lines.slice(1).join("\n").trim() : part.trim()
    };
  });
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.viewTarget));
});

document.querySelector("[data-open-reader]").addEventListener("click", () => setView("reader"));

document.querySelector("#languageToggle").addEventListener("click", () => {
  state.language = state.language === "zh" ? "en" : "zh";
  saveLanguage();
  applyLanguage();
});

document.querySelector("#authLanguageToggle").addEventListener("click", () => {
  state.language = state.language === "zh" ? "en" : "zh";
  saveLanguage();
  applyLanguage();
});

document.querySelector("#readerText").addEventListener("click", (event) => {
  const target = event.target.closest(".reader-term");
  if (!target) {
    hideDefinition();
    return;
  }
  showDictionaryForTarget(target);
});

document.querySelector("#definitionPopover").addEventListener("click", hideDefinition);
document.querySelector("#definitionAudioJump").addEventListener("click", (event) => {
  event.stopPropagation();
  const index = state.dictionarySelection && typeof state.dictionarySelection.audioIndex === "number" ? state.dictionarySelection.audioIndex : 0;
  restartTtsFrom(index);
  hideDefinition();
});
window.addEventListener("scroll", hideDefinition, { passive: true });
window.addEventListener("resize", hideDefinition);

document.addEventListener("visibilitychange", syncReadingTimer);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.tts.isPlaying && !state.tts.isPaused) {
    window.speechSynthesis.pause();
    state.tts.isPaused = true;
    setTtsStatus("ttsPaused");
  }
});

window.addEventListener("beforeunload", () => {
  if (state.readingTimer) saveReadingStats();
  stopTts("ttsIdle");
});

document.querySelector("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const nextName = document.querySelector("#displayNameInput").value.trim();
  if (!nextName) return;
  state.displayName = nextName;
  saveDisplayName();
  const accounts = loadAccounts();
  if (accounts[activeAccountId]) {
    accounts[activeAccountId].displayName = nextName;
    saveAccounts(accounts);
  }
  updateProfile();
  setView("home");
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  sessionStorage.removeItem("muyu-session-user");
  activeAccountId = "";
  showAuth();
});

document.querySelector("#authForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const mode = event.currentTarget.dataset.mode || "login";
  const name = document.querySelector("#authNameInput").value;
  const pin = document.querySelector("#authPinInput").value;
  const message = mode === "create" ? createAccount(name, pin) : loginAccount(name, pin);
  const error = document.querySelector("#authError");
  error.textContent = message;
  error.hidden = !message;
});

document.querySelector("#authModeToggle").addEventListener("click", () => {
  const mode = document.querySelector("#authForm").dataset.mode === "create" ? "login" : "create";
  document.querySelector("#authError").hidden = true;
  setAuthMode(mode);
});

document.querySelectorAll("[data-chapter-action]").forEach((button) => {
  button.addEventListener("click", () => {
    changeChapter(button.dataset.chapterAction === "next" ? 1 : -1);
  });
});

document.querySelector("#ttsToggle").addEventListener("click", toggleTts);

document.querySelector("#ttsStop").addEventListener("click", () => stopTts());

document.querySelector("#ttsBack").addEventListener("click", () => nudgeTtsCharacterOffset(-100));

document.querySelector("#ttsForward").addEventListener("click", () => nudgeTtsCharacterOffset(100));

document.querySelector("#ttsSlower").addEventListener("click", () => setTtsRate(state.tts.rate - 0.05));

document.querySelector("#ttsFaster").addEventListener("click", () => setTtsRate(state.tts.rate + 0.05));

document.querySelector("#ttsJumpInput").addEventListener("change", (event) => {
  const requestedIndex = Number(event.target.value) - 1;
  if (!Number.isFinite(requestedIndex)) return;
  restartTtsFrom(requestedIndex);
});

if (state.tts.supported) {
  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", populateTtsVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = populateTtsVoices;
  }
  populateTtsVoices();
}

function renderAll() {
  applyLanguage();
  renderHomeBooks();
  renderLibrary();
  renderReader();
}

function initializeApp() {
  const accounts = loadAccounts();
  if (!activeAccountId || !accounts[activeAccountId]) {
    sessionStorage.removeItem("muyu-session-user");
    showAuth();
    return;
  }
  loadAccountState();
  setDateLabel();
  renderAll();
}

initializeApp();
