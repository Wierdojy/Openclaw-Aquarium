const starterBooks = [];
const removedSampleTitles = new Set(["山月记", "雪国", "瓦尔登湖", "局外人"]);
let activeAccountId = sessionStorage.getItem("muyu-session-user") || "";

const state = {
  books: loadBooks(),
  displayName: loadDisplayName(),
  language: loadLanguage(),
  readingStats: loadReadingStats(),
  bookProgress: loadBookProgress(),
  libraryQuery: "",
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
    playbackId: 0,
    trackerFrame: 0,
    trackerTimeline: [],
    trackerNextStep: 0,
    trackerElapsedMs: 0,
    trackerStartedAt: 0,
    trackerBiasMs: 0,
    lastBoundaryIndex: null,
    lastBoundaryTime: null,
    estimatedMsPerChar: 150,
    charIndex: 0,
    statusKey: "ttsReady"
  },
  ambient: {
    supported: "AudioContext" in window || "webkitAudioContext" in window,
    selection: loadAmbientSelection(),
    muted: loadAmbientMuted(),
    volume: loadAmbientVolume(),
    context: null,
    masterGain: null,
    nodes: [],
    timers: [],
    isPlaying: false
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
    librarySearchLabel: "搜索书架",
    librarySearchPlaceholder: "搜索书名、作者或章节",
    libraryEmpty: "没有找到相关书目",
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
    ttsIdle: "准备播放",
    ttsReady: "准备播放",
    ttsTitle: "朗读",
    ttsPlaying: "播放中",
    ttsPaused: "已暂停",
    ttsStopped: "已停止",
    ttsDone: "本章完成",
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
    toc: "目录",
    tocCaption: "章节",
    tocTitle: "目录",
    tocClose: "关闭目录",
    tocCurrent: "当前",
    ambientCaption: "阅读环境",
    ambientTitle: "环境音乐",
    ambientChoice: "环境音乐选择",
    ambientNone: "无",
    ambientMoon: "月下",
    ambientTeahouse: "茶舍",
    ambientFerry: "渡口",
    ambientVolume: "音量",
    ambientMute: "静音",
    ambientUnmute: "取消静音",
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
    librarySearchLabel: "Search library",
    librarySearchPlaceholder: "Search title, author, or chapter",
    libraryEmpty: "No matching books found",
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
    toc: "Table of contents",
    tocCaption: "Chapters",
    tocTitle: "Contents",
    tocClose: "Close contents",
    tocCurrent: "Current",
    ambientCaption: "Reading atmosphere",
    ambientTitle: "Ambient music",
    ambientChoice: "Ambient music selection",
    ambientNone: "None",
    ambientMoon: "Moonlight",
    ambientTeahouse: "Teahouse",
    ambientFerry: "Ferry",
    ambientVolume: "Volume",
    ambientMute: "Mute",
    ambientUnmute: "Unmute",
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

function loadAmbientSelection() {
  const saved = localStorage.getItem(storageKey("ambient-selection"));
  const migrated = { rain: "moon", forest: "teahouse", lantern: "ferry" }[saved] || saved;
  return ["none", "moon", "teahouse", "ferry"].includes(migrated) ? migrated : "none";
}

function loadAmbientMuted() {
  return localStorage.getItem(storageKey("ambient-muted")) === "true";
}

function loadAmbientVolume() {
  const saved = Number(localStorage.getItem(storageKey("ambient-volume")));
  return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.35;
}

function saveAmbientSettings() {
  localStorage.setItem(storageKey("ambient-selection"), state.ambient.selection);
  localStorage.setItem(storageKey("ambient-muted"), String(state.ambient.muted));
  localStorage.setItem(storageKey("ambient-volume"), String(state.ambient.volume));
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
  stopAmbient();
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
  state.libraryQuery = "";
  state.currentBook = 0;
  state.currentChapter = 0;
  state.currentReaderText = "";
  state.dictionarySelection = null;
  state.tts.voiceURI = loadTtsVoice();
  state.tts.rate = loadTtsRate();
  state.tts.charIndex = 0;
  state.tts.statusKey = "ttsReady";
  state.ambient.selection = loadAmbientSelection();
  state.ambient.muted = loadAmbientMuted();
  state.ambient.volume = loadAmbientVolume();
  stopAmbient();
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
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });
  document.querySelector("#languageToggle").textContent = t("languageToggle");
  document.querySelector("#authLanguageToggle").textContent = t("languageToggle");
  setAuthMode(document.querySelector("#authForm").dataset.mode || (hasAccounts() ? "login" : "create"));
  updateProfile();
  updateTtsUi();
  updateAmbientUi();
  renderLibrary();
  renderReadingRhythm();
  renderToc();
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
  const query = state.libraryQuery.trim().toLowerCase();
  document.querySelector("#librarySearchInput").value = state.libraryQuery;
  const filteredBooks = state.books.filter((book) => {
    if (!query) return true;
    const searchable = [book.title, book.author]
      .concat(book.chapters.map((chapter) => chapter.title))
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });
  document.querySelector("#libraryCount").textContent = `${filteredBooks.length} ${t("booksUnit")}`;
  const list = document.querySelector("#libraryList");
  list.innerHTML = "";
  if (!filteredBooks.length) {
    const empty = document.createElement("p");
    empty.className = "library-empty";
    empty.textContent = t("libraryEmpty");
    list.append(empty);
    return;
  }
  filteredBooks.forEach((book) => {
    const index = state.books.findIndex((entry) => entry.title === book.title);
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

function setLibraryQuery(query) {
  state.libraryQuery = query;
  renderLibrary();
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
  renderToc();
  updateChapterControls();
  updateTtsUi();
}

function renderToc() {
  const book = getCurrentBook();
  const list = document.querySelector("#tocList");
  if (!book || !list) return;
  const caption = document.querySelector("#tocPanel .caption");
  if (caption) caption.textContent = book.title;
  list.innerHTML = "";
  book.chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    const number = document.createElement("span");
    const name = document.createElement("span");
    const current = document.createElement("span");
    button.className = "toc-item";
    button.type = "button";
    button.dataset.chapterIndex = String(index);
    button.classList.toggle("active", index === state.currentChapter);
    if (index === state.currentChapter) button.setAttribute("aria-current", "true");
    number.className = "toc-number";
    number.textContent = String(index + 1);
    name.className = "toc-name";
    name.textContent = chapter.title;
    current.className = "toc-current";
    current.textContent = index === state.currentChapter ? t("tocCurrent") : "";
    button.append(number, name, current);
    list.append(button);
  });
}

function openToc() {
  const panel = document.querySelector("#tocPanel");
  if (!panel) return;
  renderToc();
  panel.hidden = false;
  document.querySelector("#tocToggle").setAttribute("aria-expanded", "true");
}

function closeToc() {
  const panel = document.querySelector("#tocPanel");
  if (!panel) return;
  panel.hidden = true;
  document.querySelector("#tocToggle").setAttribute("aria-expanded", "false");
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
  const rateSlider = document.querySelector("#ttsRateSlider");
  const rateLabel = document.querySelector("#ttsRateLabel");
  const progressFill = document.querySelector("#ttsProgressFill");
  toggle.classList.toggle("is-playing", state.tts.isPlaying && !state.tts.isPaused);
  toggle.classList.toggle("tts-play-button", true);
  toggle.setAttribute("aria-label", state.tts.isPlaying && !state.tts.isPaused ? t("ttsPause") : t("ttsPlay"));
  stop.setAttribute("aria-label", t("ttsStop"));
  status.textContent = state.tts.supported ? t(state.tts.statusKey) : t("ttsUnsupported");
  if (rateLabel) rateLabel.textContent = `${state.tts.rate.toFixed(2).replace(/0$/, "")}x`;
  if (rateSlider) {
    rateSlider.value = String(state.tts.rate);
    rateSlider.disabled = !state.tts.supported;
  }
  if (progressFill) {
    const total = Math.max(state.currentReaderText.length, 1);
    progressFill.style.width = `${Math.min(100, Math.round((state.tts.charIndex / total) * 100))}%`;
  }
  toggle.disabled = !state.tts.supported;
  stop.disabled = !state.tts.supported || (!state.tts.isPlaying && !state.tts.isPaused);
  [back, forward].forEach((button) => {
    if (button) button.disabled = !state.tts.supported;
  });
}

function clearTtsHighlight() {
  document.querySelectorAll(".reader-term.speaking").forEach((node) => {
    node.classList.remove("speaking");
  });
}

function stopTtsTracker() {
  if (state.tts.trackerFrame) {
    window.cancelAnimationFrame(state.tts.trackerFrame);
  }
  state.tts.trackerFrame = 0;
  state.tts.trackerTimeline = [];
  state.tts.trackerNextStep = 0;
  state.tts.trackerElapsedMs = 0;
  state.tts.trackerStartedAt = 0;
  state.tts.trackerBiasMs = 0;
}

function pauseTtsTracker() {
  if (state.tts.trackerStartedAt) {
    state.tts.trackerElapsedMs += performance.now() - state.tts.trackerStartedAt;
    state.tts.trackerStartedAt = 0;
  }
  if (state.tts.trackerFrame) {
    window.cancelAnimationFrame(state.tts.trackerFrame);
    state.tts.trackerFrame = 0;
  }
}

function getTtsHighlightTarget(index) {
  const clampedIndex = clampTtsCharacterIndex(index);
  const target = getReaderTermAt(clampedIndex);
  return target || null;
}

function getTtsTrackerElapsedMs() {
  return state.tts.trackerElapsedMs + (state.tts.trackerStartedAt ? performance.now() - state.tts.trackerStartedAt : 0);
}

function getTtsBaseStepMs() {
  const nominalMs = 190 / Math.max(0.6, state.tts.rate || 1);
  const learnedMs = Number.isFinite(state.tts.estimatedMsPerChar) ? state.tts.estimatedMsPerChar : nominalMs;
  return Math.max(60, Math.min(260, nominalMs * 0.7 + learnedMs * 0.3));
}

function getTtsTimingWeight(char) {
  if (!char) return 1;
  if (/\s/.test(char)) return 0.18;
  if (/[。！？!?…]/.test(char)) return 1.65;
  if (/[，、；：,:;]/.test(char)) return 0.95;
  if (/[“”"'‘’（）()《》〈〉【】\[\]—-]/.test(char)) return 0.3;
  if (/[0-9A-Za-z]/.test(char)) return 0.92;
  return 1;
}

function buildTtsTimeline(text, absoluteStartIndex) {
  const timeline = [];
  const baseStepMs = getTtsBaseStepMs();
  let elapsedMs = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const absoluteIndex = absoluteStartIndex + index;
    if (isChineseCharacter(char)) {
      timeline.push({ absoluteIndex, atMs: elapsedMs });
    }
    elapsedMs += baseStepMs * getTtsTimingWeight(char);
  }
  return timeline;
}

function findTtsNextTimelineStep(absoluteIndex) {
  const nextStep = state.tts.trackerTimeline.findIndex((step) => step.absoluteIndex > absoluteIndex);
  return nextStep >= 0 ? nextStep : state.tts.trackerTimeline.length;
}

function findTtsTimelineStepIndex(absoluteIndex) {
  return state.tts.trackerTimeline.findIndex((step) => step.absoluteIndex === absoluteIndex);
}

function pumpTtsTracker(playbackId) {
  state.tts.trackerFrame = 0;
  if (playbackId !== state.tts.playbackId || state.tts.requestedStop || !state.tts.isPlaying || state.tts.isPaused) return;
  const elapsedMs = getTtsTrackerElapsedMs();
  while (state.tts.trackerNextStep < state.tts.trackerTimeline.length) {
    const step = state.tts.trackerTimeline[state.tts.trackerNextStep];
    if (elapsedMs < step.atMs + state.tts.trackerBiasMs) break;
    if (step.absoluteIndex > state.tts.charIndex) {
      setTtsCharacterIndex(step.absoluteIndex, false);
    }
    state.tts.trackerNextStep += 1;
  }
  if (state.tts.trackerNextStep < state.tts.trackerTimeline.length) {
    state.tts.trackerFrame = window.requestAnimationFrame(() => pumpTtsTracker(playbackId));
  }
}

function startTtsTracker(playbackId, chunk, chunkOffset) {
  stopTtsTracker();
  const spokenStartIndex = chunk.start + chunkOffset;
  const spokenText = chunk.text.slice(chunkOffset);
  state.tts.trackerTimeline = buildTtsTimeline(spokenText, spokenStartIndex);
  state.tts.trackerNextStep = findTtsNextTimelineStep(state.tts.charIndex);
  state.tts.trackerElapsedMs = 0;
  state.tts.trackerStartedAt = performance.now();
  state.tts.trackerBiasMs = 0;
  if (!state.tts.trackerTimeline.length) return;
  state.tts.trackerFrame = window.requestAnimationFrame(() => pumpTtsTracker(playbackId));
}

function resumeTtsTracker(playbackId) {
  if (playbackId !== state.tts.playbackId || !state.tts.isPlaying || state.tts.isPaused || !state.tts.trackerTimeline.length) return;
  if (!state.tts.trackerStartedAt) {
    state.tts.trackerStartedAt = performance.now();
  }
  if (!state.tts.trackerFrame) {
    state.tts.trackerFrame = window.requestAnimationFrame(() => pumpTtsTracker(playbackId));
  }
}

function syncTtsTracker(playbackId, absoluteIndex, elapsedTimeMs = null) {
  if (playbackId !== state.tts.playbackId) return;
  if (Number.isFinite(elapsedTimeMs)) {
    state.tts.trackerElapsedMs = Math.max(0, elapsedTimeMs);
    if (state.tts.trackerStartedAt) {
      state.tts.trackerStartedAt = performance.now();
    }
  }
  if (isChineseCharacter(state.currentReaderText[absoluteIndex])) {
    setTtsCharacterIndex(absoluteIndex, false);
  }
  const timelineStepIndex = findTtsTimelineStepIndex(absoluteIndex);
  if (timelineStepIndex >= 0 && Number.isFinite(elapsedTimeMs)) {
    state.tts.trackerBiasMs = Math.max(-180, Math.min(900, elapsedTimeMs - state.tts.trackerTimeline[timelineStepIndex].atMs));
  }
  if (state.tts.trackerTimeline.length) {
    state.tts.trackerNextStep = findTtsNextTimelineStep(absoluteIndex);
  }
  if (!state.tts.trackerFrame && !state.tts.isPaused && state.tts.isPlaying && state.tts.trackerTimeline.length) {
    state.tts.trackerFrame = window.requestAnimationFrame(() => pumpTtsTracker(playbackId));
  }
}

function highlightTtsCharacter(index) {
  clearTtsHighlight();
  const target = getTtsHighlightTarget(index);
  if (target) target.classList.add("speaking");
}

function clampTtsCharacterIndex(index) {
  const maxIndex = Math.max(0, state.currentReaderText.length - 1);
  return Math.min(Math.max(0, index), maxIndex);
}

function findTtsChunkIndexAt(chunks, index) {
  if (!chunks.length) return -1;
  const clampedIndex = clampTtsCharacterIndex(index);
  const containingIndex = chunks.findIndex((chunk) => clampedIndex >= chunk.start && clampedIndex < chunk.end);
  if (containingIndex >= 0) return containingIndex;
  const nextIndex = chunks.findIndex((chunk) => clampedIndex < chunk.start);
  return nextIndex >= 0 ? nextIndex : chunks.length - 1;
}

function getTtsStartIndexForChunk(chunks, index) {
  const chunkIndex = findTtsChunkIndexAt(chunks, index);
  if (chunkIndex < 0) return 0;
  const chunk = chunks[chunkIndex];
  return clampTtsCharacterIndex(Math.min(Math.max(index, chunk.start), chunk.end - 1));
}

function setTtsCharacterIndex(index, shouldScroll = false) {
  state.tts.charIndex = clampTtsCharacterIndex(index);
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
    stopTtsTracker();
    setTtsCharacterIndex(Math.max(0, state.currentReaderText.length - 1), false);
    setTtsStatus("ttsDone");
    return;
  }

  const chunkOffset = state.tts.charIndex > chunk.start && state.tts.charIndex < chunk.end ? state.tts.charIndex - chunk.start : 0;
  const playbackId = state.tts.playbackId;
  const utterance = new SpeechSynthesisUtterance(chunk.text.slice(chunkOffset));
  const voice = getSelectedTtsVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice ? voice.lang : "zh-CN";
  utterance.rate = state.tts.rate;
  utterance.pitch = 1;
  state.tts.utterance = utterance;
  utterance.onstart = () => {
    if (playbackId !== state.tts.playbackId || state.tts.requestedStop) return;
    startTtsTracker(playbackId, chunk, chunkOffset);
  };
  utterance.onboundary = (event) => {
    if (playbackId !== state.tts.playbackId || state.tts.requestedStop) return;
    if (typeof event.charIndex !== "number") return;
    const absoluteIndex = chunk.start + chunkOffset + event.charIndex;
    const elapsedTimeMs = typeof event.elapsedTime === "number" && Number.isFinite(event.elapsedTime) ? Math.max(0, event.elapsedTime * 1000) : null;
    const previousBoundaryIndex = typeof state.tts.lastBoundaryIndex === "number" ? state.tts.lastBoundaryIndex : null;
    if (typeof event.elapsedTime === "number" && Number.isFinite(event.elapsedTime)) {
      if (previousBoundaryIndex !== null && typeof state.tts.lastBoundaryTime === "number" && absoluteIndex > previousBoundaryIndex) {
        const deltaTimeMs = Math.max(40, (event.elapsedTime - state.tts.lastBoundaryTime) * 1000);
        const deltaChars = Math.max(1, absoluteIndex - previousBoundaryIndex);
        state.tts.estimatedMsPerChar = Math.max(70, Math.min(260, deltaTimeMs / deltaChars));
      }
      state.tts.lastBoundaryTime = event.elapsedTime;
    }
    if (previousBoundaryIndex === null || absoluteIndex > previousBoundaryIndex) {
      state.tts.lastBoundaryIndex = absoluteIndex;
    }
    syncTtsTracker(playbackId, absoluteIndex, elapsedTimeMs);
  };
  utterance.onend = () => {
    if (playbackId !== state.tts.playbackId || state.tts.requestedStop) return;
    const lastSpokenStep = state.tts.trackerTimeline[state.tts.trackerTimeline.length - 1];
    stopTtsTracker();
    setTtsCharacterIndex(lastSpokenStep ? lastSpokenStep.absoluteIndex : chunk.end, false);
    state.tts.chunkIndex += 1;
    speakNextTtsChunk();
  };
  utterance.onerror = () => {
    if (playbackId !== state.tts.playbackId || state.tts.requestedStop) return;
    stopTtsTracker();
    state.tts.isPlaying = false;
    state.tts.isPaused = false;
    setTtsStatus("ttsStopped");
  };
  window.speechSynthesis.speak(utterance);
}

function prepareTtsAt(startIndex, statusKey = "ttsIdle", shouldScroll = false) {
  const chunks = chunkTtsText(state.currentReaderText);
  state.tts.requestedStop = true;
  state.tts.playbackId += 1;
  stopTtsTracker();
  window.speechSynthesis.cancel();
  state.tts.chunks = chunks;
  state.tts.chunkIndex = findTtsChunkIndexAt(chunks, startIndex);
  state.tts.utterance = null;
  state.tts.isPlaying = false;
  state.tts.isPaused = false;
  state.tts.lastBoundaryIndex = null;
  state.tts.lastBoundaryTime = null;
  const seekIndex = chunks.length ? getTtsStartIndexForChunk(chunks, startIndex) : startIndex;
  setTtsCharacterIndex(seekIndex, shouldScroll);
  setTtsStatus(statusKey);
  return chunks.length > 0;
}

function startTts(startIndex = state.tts.charIndex) {
  if (!state.tts.supported) return;
  const chunks = chunkTtsText(state.currentReaderText);
  if (!chunks.length) return;
  state.tts.requestedStop = true;
  state.tts.playbackId += 1;
  stopTtsTracker();
  window.speechSynthesis.cancel();
  state.tts.chunks = chunks;
  state.tts.charIndex = getTtsStartIndexForChunk(chunks, startIndex);
  state.tts.chunkIndex = findTtsChunkIndexAt(chunks, state.tts.charIndex);
  state.tts.isPlaying = true;
  state.tts.isPaused = false;
  state.tts.requestedStop = false;
  state.tts.lastBoundaryIndex = null;
  state.tts.lastBoundaryTime = null;
  highlightTtsCharacter(state.tts.charIndex);
  setTtsStatus("ttsPlaying");
  speakNextTtsChunk();
}

function toggleTts() {
  if (!state.tts.supported) return;
  if (state.tts.isPlaying && !state.tts.isPaused) {
    window.speechSynthesis.pause();
    pauseTtsTracker();
    state.tts.isPaused = true;
    setTtsStatus("ttsPaused");
    return;
  }
  if (state.tts.isPlaying && state.tts.isPaused) {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else {
      startTts(state.tts.charIndex);
      return;
    }
    state.tts.isPaused = false;
    resumeTtsTracker(state.tts.playbackId);
    setTtsStatus("ttsPlaying");
    return;
  }
  startTts();
}

function stopTts(statusKey = "ttsStopped") {
  if (!state.tts.supported) return;
  state.tts.requestedStop = true;
  state.tts.playbackId += 1;
  stopTtsTracker();
  window.speechSynthesis.cancel();
  state.tts.chunks = [];
  state.tts.chunkIndex = 0;
  state.tts.charIndex = 0;
  state.tts.isPlaying = false;
  state.tts.isPaused = false;
  state.tts.lastBoundaryIndex = null;
  state.tts.lastBoundaryTime = null;
  clearTtsHighlight();
  setTtsStatus(statusKey);
}

function restartTtsFrom(charIndex) {
  if (!state.tts.supported) return;
  const wasPlaying = state.tts.isPlaying && !state.tts.isPaused;
  const wasPaused = state.tts.isPlaying && state.tts.isPaused;
  const shouldScroll = !wasPlaying && !wasPaused;
  if (wasPlaying) {
    startTts(charIndex);
    return;
  }
  if (wasPaused) {
    if (!prepareTtsAt(charIndex, "ttsPaused", shouldScroll)) return;
    state.tts.isPlaying = true;
    state.tts.isPaused = true;
    updateTtsUi();
    return;
  }
  prepareTtsAt(charIndex, "ttsIdle", shouldScroll);
}

function nudgeTtsCharacterOffset(amount) {
  restartTtsFrom(state.tts.charIndex + amount);
}

function startTtsFromDictionary(index) {
  if (!state.tts.supported) return;
  startTts(index);
}

function setTtsRate(rate) {
  const wasPlaying = state.tts.isPlaying && !state.tts.isPaused;
  const wasPaused = state.tts.isPlaying && state.tts.isPaused;
  const currentIndex = state.tts.charIndex;
  state.tts.rate = Math.max(0.6, Math.min(1.8, rate));
  saveTtsRate();
  if (wasPlaying) {
    startTts(currentIndex);
  } else if (wasPaused) {
    if (!prepareTtsAt(currentIndex, "ttsPaused", false)) return;
    state.tts.isPlaying = true;
    state.tts.isPaused = true;
  }
  updateTtsUi();
}

function getAudioContext() {
  if (!state.ambient.supported) return null;
  if (!state.ambient.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.ambient.context = new AudioContextClass();
    state.ambient.masterGain = state.ambient.context.createGain();
    state.ambient.masterGain.connect(state.ambient.context.destination);
  }
  return state.ambient.context;
}

function createNoiseBuffer(context, duration = 2) {
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function addLoopedNoise(context, destination, filterType, frequency, gainValue, qValue = 0.0001) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createNoiseBuffer(context);
  source.loop = true;
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = qValue;
  gain.gain.value = gainValue;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start();
  state.ambient.nodes.push(source, filter, gain);
}

function addSoftTone(context, destination, frequency, gainValue, detune = 0, type = "sine") {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start();
  state.ambient.nodes.push(oscillator, gain);
}

function registerAmbientTimer(timerId) {
  state.ambient.timers.push(timerId);
}

function clearAmbientTimers() {
  state.ambient.timers.forEach((timerId) => window.clearInterval(timerId));
  state.ambient.timers = [];
}

function createAmbientDelay(context, destination, delayTime, feedbackGain, wetGain) {
  const input = context.createGain();
  const output = context.createGain();
  const delay = context.createDelay(1.2);
  const feedback = context.createGain();
  const wet = context.createGain();
  delay.delayTime.value = delayTime;
  feedback.gain.value = feedbackGain;
  wet.gain.value = wetGain;
  input.connect(output);
  input.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(output);
  output.connect(destination);
  state.ambient.nodes.push(input, output, delay, feedback, wet);
  return input;
}

function scheduleAmbientNote(context, destination, {
  start,
  frequency,
  duration = 1.6,
  gain = 0.05,
  attack = 0.04,
  release = 0.7,
  detune = 0,
  type = "sine",
  filterFrequency = 1800,
  q = 0.7
}) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const noteGain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  filter.type = "lowpass";
  filter.frequency.value = filterFrequency;
  filter.Q.value = q;
  noteGain.gain.setValueAtTime(0.0001, start);
  noteGain.gain.linearRampToValueAtTime(gain, start + attack);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);
  oscillator.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + release + 0.05);
  state.ambient.nodes.push(oscillator, filter, noteGain);
}

function scheduleAmbientBellAccent(context, destination, { start, frequency, gain = 0.022, duration = 1.8 }) {
  scheduleAmbientNote(context, destination, {
    start,
    frequency,
    duration,
    gain,
    attack: 0.01,
    release: 1.4,
    type: "triangle",
    filterFrequency: 2200,
    q: 1.2
  });
  scheduleAmbientNote(context, destination, {
    start: start + 0.02,
    frequency: frequency * 1.5,
    duration: duration * 0.72,
    gain: gain * 0.42,
    attack: 0.01,
    release: 1,
    type: "sine",
    filterFrequency: 2800,
    q: 0.8
  });
}

function scheduleAmbientPhrase(context, destination, notes, defaults = {}) {
  notes.forEach((note) => {
    scheduleAmbientNote(context, destination, {
      ...defaults,
      ...note
    });
  });
}

function scheduleAmbientNoiseBurst(context, destination, {
  start,
  duration = 0.18,
  gain = 0.02,
  filterType = "bandpass",
  frequency = 1200,
  q = 2.8
}) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const burstGain = context.createGain();
  source.buffer = createNoiseBuffer(context, 1);
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  burstGain.gain.setValueAtTime(0.0001, start);
  burstGain.gain.linearRampToValueAtTime(gain, start + 0.02);
  burstGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(burstGain);
  burstGain.connect(destination);
  source.start(start);
  source.stop(start + duration + 0.05);
  state.ambient.nodes.push(source, filter, burstGain);
}

function startAmbientLoop(context, cycleSeconds, callback) {
  const scheduleCycle = () => callback(context.currentTime + 0.06);
  scheduleCycle();
  registerAmbientTimer(window.setInterval(scheduleCycle, cycleSeconds * 1000));
}

function stopAmbient() {
  clearAmbientTimers();
  state.ambient.nodes.forEach((node) => {
    if (typeof node.stop === "function") {
      try {
        node.stop();
      } catch (error) {
        // Already stopped.
      }
    }
    if (typeof node.disconnect === "function") node.disconnect();
  });
  state.ambient.nodes = [];
  state.ambient.isPlaying = false;
}

function updateAmbientGain() {
  if (!state.ambient.masterGain || !state.ambient.context) return;
  const target = state.ambient.muted || state.ambient.selection === "none" ? 0 : state.ambient.volume;
  state.ambient.masterGain.gain.setTargetAtTime(target, state.ambient.context.currentTime, 0.08);
}

function startAmbient() {
  if (!state.ambient.supported || state.ambient.selection === "none") {
    stopAmbient();
    updateAmbientUi();
    return;
  }
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();
  stopAmbient();
  const padBus = createAmbientDelay(context, state.ambient.masterGain, 0.34, 0.42, 0.32);
  const bellBus = createAmbientDelay(context, state.ambient.masterGain, 0.52, 0.48, 0.4);
  const fxBus = createAmbientDelay(context, state.ambient.masterGain, 0.21, 0.26, 0.2);
  if (state.ambient.selection === "moon") {
    addSoftTone(context, padBus, 196, 0.018, -3, "sine");
    addSoftTone(context, padBus, 293.66, 0.014, 4, "triangle");
    startAmbientLoop(context, 8, (start) => {
      [
        { at: 0.0, frequency: 392, duration: 1.5, gain: 0.026 },
        { at: 1.8, frequency: 440, duration: 1.2, gain: 0.022 },
        { at: 3.3, frequency: 587.33, duration: 1.4, gain: 0.024 },
        { at: 5.2, frequency: 659.25, duration: 1.1, gain: 0.018 },
        { at: 6.4, frequency: 440, duration: 1.6, gain: 0.02 }
      ].forEach((note) => {
        scheduleAmbientNote(context, bellBus, {
          start: start + note.at,
          frequency: note.frequency,
          duration: note.duration,
          gain: note.gain,
          attack: 0.03,
          release: 1.2,
          type: "triangle",
          filterFrequency: 1500
        });
      });
    });
  } else if (state.ambient.selection === "teahouse") {
    addSoftTone(context, padBus, 174.61, 0.015, -5, "triangle");
    addSoftTone(context, padBus, 261.63, 0.012, 2, "sine");
    addSoftTone(context, padBus, 392, 0.008, -7, "sine");
    startAmbientLoop(context, 8, (start) => {
      scheduleAmbientPhrase(
        context,
        bellBus,
        [
          { start: start + 0.0, frequency: 392, duration: 0.84, gain: 0.026 },
          { start: start + 0.58, frequency: 440, duration: 0.42, gain: 0.012, detune: 5 },
          { start: start + 1.15, frequency: 523.25, duration: 0.88, gain: 0.023 },
          { start: start + 1.82, frequency: 587.33, duration: 0.52, gain: 0.015, detune: -4 },
          { start: start + 2.42, frequency: 659.25, duration: 0.72, gain: 0.019 },
          { start: start + 3.3, frequency: 523.25, duration: 1.08, gain: 0.022 },
          { start: start + 4.52, frequency: 440, duration: 0.66, gain: 0.017 },
          { start: start + 5.18, frequency: 392, duration: 0.54, gain: 0.014, detune: 3 },
          { start: start + 5.86, frequency: 523.25, duration: 0.82, gain: 0.02 },
          { start: start + 6.58, frequency: 440, duration: 0.48, gain: 0.013 },
          { start: start + 7.02, frequency: 392, duration: 1.15, gain: 0.021 }
        ],
        {
          attack: 0.014,
          release: 0.96,
          type: "sine",
          filterFrequency: 1850
        }
      );
      scheduleAmbientPhrase(
        context,
        fxBus,
        [
          { start: start + 0.34, frequency: 784, duration: 0.28, gain: 0.007, type: "triangle", filterFrequency: 2400 },
          { start: start + 2.7, frequency: 1174.66, duration: 0.24, gain: 0.006, type: "triangle", filterFrequency: 2600 },
          { start: start + 5.56, frequency: 880, duration: 0.3, gain: 0.0075, type: "triangle", filterFrequency: 2500 }
        ],
        {
          attack: 0.01,
          release: 0.28
        }
      );
      [
        { at: 0.76, frequency: 1180, gain: 0.009, duration: 0.09, q: 4.2 },
        { at: 2.28, frequency: 860, gain: 0.011, duration: 0.12, q: 3.5 },
        { at: 4.18, frequency: 1420, gain: 0.008, duration: 0.08, q: 4.8 },
        { at: 6.08, frequency: 920, gain: 0.01, duration: 0.11, q: 3.9 }
      ].forEach((accent) => {
        scheduleAmbientNoiseBurst(context, fxBus, {
          start: start + accent.at,
          frequency: accent.frequency,
          gain: accent.gain,
          duration: accent.duration,
          filterType: "bandpass",
          q: accent.q
        });
      });
      scheduleAmbientBellAccent(context, fxBus, { start: start + 3.92, frequency: 659.25, gain: 0.008, duration: 0.96 });
      scheduleAmbientBellAccent(context, fxBus, { start: start + 6.72, frequency: 783.99, gain: 0.01, duration: 1.05 });
    });
  } else if (state.ambient.selection === "ferry") {
    addSoftTone(context, padBus, 146.83, 0.018, -2, "sine");
    addSoftTone(context, padBus, 220, 0.011, 3, "triangle");
    addLoopedNoise(context, padBus, "lowpass", 240, 0.01);
    addLoopedNoise(context, fxBus, "bandpass", 540, 0.006, 0.9);
    startAmbientLoop(context, 10, (start) => {
      scheduleAmbientPhrase(
        context,
        bellBus,
        [
          { start: start + 0.0, frequency: 293.66, duration: 1.2, gain: 0.022 },
          { start: start + 1.35, frequency: 329.63, duration: 0.78, gain: 0.015, detune: -5 },
          { start: start + 2.28, frequency: 392, duration: 0.98, gain: 0.02 },
          { start: start + 3.92, frequency: 440, duration: 0.86, gain: 0.017 },
          { start: start + 4.88, frequency: 392, duration: 1.12, gain: 0.019 },
          { start: start + 6.36, frequency: 349.23, duration: 1.18, gain: 0.018 },
          { start: start + 7.82, frequency: 329.63, duration: 0.92, gain: 0.016 },
          { start: start + 8.74, frequency: 293.66, duration: 1.45, gain: 0.017 }
        ],
        {
          attack: 0.028,
          release: 1.5,
          type: "triangle",
          filterFrequency: 1450
        }
      );
      scheduleAmbientPhrase(
        context,
        fxBus,
        [
          { start: start + 0.44, frequency: 587.33, duration: 1.8, gain: 0.0058, type: "sine", filterFrequency: 1200 },
          { start: start + 5.74, frequency: 523.25, duration: 1.95, gain: 0.0055, type: "sine", filterFrequency: 1150 }
        ],
        {
          attack: 0.12,
          release: 1.1
        }
      );
      [
        { at: 0.22, frequency: 196, gain: 0.013, duration: 2.3 },
        { at: 5.46, frequency: 220, gain: 0.012, duration: 2.1 }
      ].forEach((bell) => {
        scheduleAmbientBellAccent(context, fxBus, { start: start + bell.at, frequency: bell.frequency, gain: bell.gain, duration: bell.duration });
      });
      [
        { at: 1.94, frequency: 310, gain: 0.006, duration: 0.34, q: 0.85 },
        { at: 4.62, frequency: 470, gain: 0.0075, duration: 0.2, q: 1.15 },
        { at: 7.38, frequency: 340, gain: 0.0085, duration: 0.28, q: 0.92 }
      ].forEach((wave) => {
        scheduleAmbientNoiseBurst(context, fxBus, {
          start: start + wave.at,
          frequency: wave.frequency,
          gain: wave.gain,
          duration: wave.duration,
          filterType: "lowpass",
          q: wave.q
        });
      });
    });
  }
  state.ambient.isPlaying = true;
  updateAmbientGain();
  updateAmbientUi();
}

function updateAmbientUi() {
  const panel = document.querySelector(".ambient-panel");
  if (!panel) return;
  const muteToggle = document.querySelector("#ambientMuteToggle");
  const volumeSlider = document.querySelector("#ambientVolumeSlider");
  document.querySelectorAll("[data-ambient]").forEach((button) => {
    const isActive = button.dataset.ambient === state.ambient.selection;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
  muteToggle.classList.toggle("is-muted", state.ambient.muted);
  muteToggle.setAttribute("aria-label", t(state.ambient.muted ? "ambientUnmute" : "ambientMute"));
  muteToggle.disabled = !state.ambient.supported || state.ambient.selection === "none";
  volumeSlider.value = String(state.ambient.volume);
  volumeSlider.disabled = !state.ambient.supported || state.ambient.selection === "none";
  panel.classList.toggle("is-muted", state.ambient.muted);
}

function setAmbientSelection(selection) {
  state.ambient.selection = selection;
  saveAmbientSettings();
  startAmbient();
}

function setAmbientMuted(muted) {
  state.ambient.muted = muted;
  saveAmbientSettings();
  updateAmbientGain();
  updateAmbientUi();
}

function setAmbientVolume(volume) {
  state.ambient.volume = Math.max(0, Math.min(1, volume));
  saveAmbientSettings();
  updateAmbientGain();
  updateAmbientUi();
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
    closeToc();
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
  const nextChapter = state.currentChapter + direction;
  jumpToChapter(nextChapter);
}

function jumpToChapter(nextChapter) {
  const book = state.books[state.currentBook];
  if (nextChapter < 0 || nextChapter >= book.chapters.length) return;
  closeToc();
  if (nextChapter === state.currentChapter) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
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
  startTtsFromDictionary(index);
  hideDefinition();
});
window.addEventListener("scroll", hideDefinition, { passive: true });
window.addEventListener("resize", hideDefinition);

document.addEventListener("visibilitychange", syncReadingTimer);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.tts.isPlaying && !state.tts.isPaused) {
    window.speechSynthesis.pause();
    pauseTtsTracker();
    state.tts.isPaused = true;
    setTtsStatus("ttsPaused");
  }
});

window.addEventListener("beforeunload", () => {
  if (state.readingTimer) saveReadingStats();
  stopTts("ttsIdle");
  stopAmbient();
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

document.querySelector("#tocToggle").addEventListener("click", () => {
  const panel = document.querySelector("#tocPanel");
  if (panel.hidden) {
    openToc();
  } else {
    closeToc();
  }
});

document.querySelector("#tocClose").addEventListener("click", closeToc);

document.querySelector("#tocPanel").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeToc();
});

document.querySelector("#tocList").addEventListener("click", (event) => {
  const item = event.target.closest(".toc-item");
  if (!item) return;
  jumpToChapter(Number(item.dataset.chapterIndex));
});

document.querySelector("#ttsToggle").addEventListener("click", toggleTts);

document.querySelector("#ttsStop").addEventListener("click", () => stopTts());

document.querySelector("#ttsBack").addEventListener("click", () => nudgeTtsCharacterOffset(-100));

document.querySelector("#ttsForward").addEventListener("click", () => nudgeTtsCharacterOffset(100));

document.querySelector("#ttsRateSlider").addEventListener("input", (event) => {
  setTtsRate(Number(event.target.value));
});

document.querySelector("#ambientOptions").addEventListener("click", (event) => {
  const option = event.target.closest("[data-ambient]");
  if (!option) return;
  setAmbientSelection(option.dataset.ambient);
});

document.querySelector("#ambientMuteToggle").addEventListener("click", () => {
  setAmbientMuted(!state.ambient.muted);
  if (!state.ambient.muted && state.ambient.selection !== "none" && !state.ambient.isPlaying) {
    startAmbient();
  }
});

document.querySelector("#ambientVolumeSlider").addEventListener("input", (event) => {
  setAmbientVolume(Number(event.target.value));
  if (state.ambient.selection !== "none" && !state.ambient.isPlaying) {
    startAmbient();
  }
});

document.querySelector("#librarySearchInput").addEventListener("input", (event) => {
  setLibraryQuery(event.target.value.trim());
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
