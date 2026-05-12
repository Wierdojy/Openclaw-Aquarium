const starterBooks = [];
const removedSampleTitles = new Set(["山月记", "雪国", "瓦尔登湖", "局外人"]);

const state = {
  books: loadBooks(),
  displayName: loadDisplayName(),
  language: loadLanguage(),
  readingStats: loadReadingStats(),
  bookProgress: loadBookProgress(),
  activeView: "home",
  readingTimer: null,
  currentBook: 0,
  currentChapter: 0
};

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

const characterDictionary = { ...(window.MUYU_DICTIONARY || {}), ...customDictionary };
const dictionaryTermsByFirstChar = Object.keys(characterDictionary).reduce((groups, term) => {
  const firstChar = term[0];
  if (!groups[firstChar]) groups[firstChar] = [];
  groups[firstChar].push(term);
  return groups;
}, {});

Object.values(dictionaryTermsByFirstChar).forEach((terms) => terms.sort((a, b) => b.length - a.length));

function isChineseCharacter(char) {
  return /\p{Script=Han}/u.test(char);
}

function loadBooks() {
  const bundledBooks = Array.isArray(window.MUYU_BOOKS) ? window.MUYU_BOOKS : [];
  const saved = localStorage.getItem("muyu-books");
  if (!saved) return applySavedBookProgress([...bundledBooks, ...starterBooks]);
  try {
    const savedBooks = JSON.parse(saved);
    const bundledTitles = new Set(bundledBooks.map((book) => book.title));
    const savedUserBooks = savedBooks.filter((book) => !bundledTitles.has(book.title) && !removedSampleTitles.has(book.title));
    if (savedUserBooks.length !== savedBooks.length) {
      localStorage.setItem("muyu-books", JSON.stringify(savedUserBooks));
    }
    const savedTitles = new Set(savedUserBooks.map((book) => book.title));
    const newBundledBooks = bundledBooks.filter((book) => !savedTitles.has(book.title));
    return applySavedBookProgress([...newBundledBooks, ...savedUserBooks]);
  } catch {
    return applySavedBookProgress([...bundledBooks, ...starterBooks]);
  }
}

function saveBooks() {
  const bundledTitles = new Set([...(window.MUYU_BOOKS || []), ...starterBooks].map((book) => book.title));
  const userBooks = state.books.filter((book) => !bundledTitles.has(book.title) && !removedSampleTitles.has(book.title));
  localStorage.setItem("muyu-books", JSON.stringify(userBooks));
}

function loadDisplayName() {
  return localStorage.getItem("muyu-display-name") || "袁孝正";
}

function saveDisplayName() {
  localStorage.setItem("muyu-display-name", state.displayName);
}

function loadLanguage() {
  return localStorage.getItem("muyu-language") || "zh";
}

function saveLanguage() {
  localStorage.setItem("muyu-language", state.language);
}

function loadReadingStats() {
  const saved = localStorage.getItem("muyu-reading-stats");
  if (!saved) return {};
  try {
    const parsed = JSON.parse(saved);
    if (Object.values(parsed).some((value) => typeof value === "number")) {
      const firstBookTitle = (window.MUYU_BOOKS || [])[0]?.title || "book";
      return { [firstBookTitle]: parsed };
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveReadingStats() {
  localStorage.setItem("muyu-reading-stats", JSON.stringify(state.readingStats));
}

function loadBookProgress() {
  const saved = localStorage.getItem("muyu-book-progress");
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function saveBookProgress() {
  localStorage.setItem("muyu-book-progress", JSON.stringify(state.bookProgress));
}

function applySavedBookProgress(books) {
  const progress = loadBookProgress();
  return books.map((book) => ({
    ...book,
    progress: progress[book.title]?.progress ?? book.progress ?? 0
  }));
}

function t(key) {
  return translations[state.language][key] || translations.zh[key] || key;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function getCurrentBook() {
  return state.books[state.currentBook];
}

function getCurrentBookTitle() {
  return getCurrentBook()?.title || "book";
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
  const maxSeconds = Math.max(...secondsByDay, 60);
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
  updateProfile();
  renderLibrary();
  renderReadingRhythm();
}

function coverClass(book) {
  return book.color === "terra" ? "terra" : book.color === "blue" ? "blue" : "";
}

function renderHomeBooks() {
  const homeBooks = document.querySelector("#homeBooks");
  homeBooks.innerHTML = "";
  state.books.slice(0, 3).forEach((book, index) => {
    const button = document.createElement("button");
    button.className = "book-card";
    button.type = "button";
    button.innerHTML = `
      <div class="cover ${coverClass(book)}"></div>
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
      <div class="cover ${coverClass(book)}"></div>
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
    const remaining = text.slice(index);
    const term = (dictionaryTermsByFirstChar[remaining[0]] || []).find((entry) => remaining.startsWith(entry));
    if (term) {
      const button = document.createElement("button");
      button.className = "reader-term";
      button.type = "button";
      button.textContent = term;
      button.dataset.term = term;
      container.append(button);
      index += term.length;
      continue;
    }
    const char = text[index];
    if (isChineseCharacter(char)) {
      const button = document.createElement("button");
      button.className = "reader-term";
      button.type = "button";
      button.textContent = char;
      button.dataset.term = char;
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

function renderReader() {
  const book = state.books[state.currentBook];
  const chapter = book.chapters[state.currentChapter];
  const progress = getBookProgress();
  book.progress = progress;
  state.bookProgress[book.title] = {
    chapter: state.currentChapter,
    progress
  };
  saveBookProgress();
  document.querySelector("#readerBook").textContent = book.title;
  document.querySelector("#readerChapter").textContent = chapter.title;
  renderInteractiveText(chapter.text);
  hideDefinition();
  document.querySelector("#chapterProgress").textContent = `${state.currentChapter + 1} / ${book.chapters.length}`;
  document.querySelector("#currentTitle").textContent = book.title;
  document.querySelector("#currentChapter").textContent = `${chapter.title} · ${progress}%`;
  document.querySelector("#currentExcerpt").textContent = chapter.text.split("\n").find(Boolean) || "";
  document.querySelector("#currentProgressFill").style.width = `${progress}%`;
  document.querySelector("#currentProgressPath").setAttribute("aria-label", `阅读进度 ${progress}%`);
  renderHomeBooks();
  renderLibrary();
}

function showDefinition(target) {
  const term = target.dataset.term;
  const [pinyin, meaning] = characterDictionary[term] || [t("unknownPinyin"), t("unknownMeaning")];
  const popover = document.querySelector("#definitionPopover");
  document.querySelectorAll(".reader-term.active").forEach((node) => node.classList.remove("active"));
  target.classList.add("active");
  document.querySelector("#definitionChar").textContent = term;
  document.querySelector("#definitionPinyin").textContent = pinyin;
  document.querySelector("#definitionMeaning").textContent = meaning;
  popover.hidden = false;
  positionDefinitionPopover(target, popover);
}

function hideDefinition() {
  document.querySelectorAll(".reader-term.active").forEach((node) => node.classList.remove("active"));
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
  const savedChapter = state.bookProgress[state.books[index].title]?.chapter ?? 0;
  state.currentChapter = Math.min(savedChapter, state.books[index].chapters.length - 1);
  renderReader();
  setView("reader");
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

document.querySelector("#readerText").addEventListener("click", (event) => {
  const target = event.target.closest(".reader-term");
  if (!target) {
    hideDefinition();
    return;
  }
  showDefinition(target);
});

document.querySelector("#definitionPopover").addEventListener("click", hideDefinition);
window.addEventListener("scroll", hideDefinition, { passive: true });
window.addEventListener("resize", hideDefinition);

document.addEventListener("visibilitychange", syncReadingTimer);

window.addEventListener("beforeunload", () => {
  if (state.readingTimer) saveReadingStats();
});

document.querySelector("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const nextName = document.querySelector("#displayNameInput").value.trim();
  if (!nextName) return;
  state.displayName = nextName;
  saveDisplayName();
  updateProfile();
  setView("home");
});

document.querySelector("#prevChapter").addEventListener("click", () => {
  if (state.currentChapter > 0) {
    state.currentChapter -= 1;
    renderReader();
  }
});

document.querySelector("#nextChapter").addEventListener("click", () => {
  const book = state.books[state.currentBook];
  if (state.currentChapter < book.chapters.length - 1) {
    state.currentChapter += 1;
    renderReader();
  }
});

function renderAll() {
  applyLanguage();
  renderHomeBooks();
  renderLibrary();
  renderReader();
}

setDateLabel();
renderAll();
