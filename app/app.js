const starterBooks = [];

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

const characterDictionary = {
  一轮: ["yi1 lun2", "one round; one full disk"],
  一声: ["yi1 sheng1", "one sound; a cry"],
  一句: ["yi1 ju4", "one sentence"],
  一层: ["yi1 ceng2", "one layer"],
  一个: ["yi2 ge4", "one; a single"],
  过去: ["guo4 qu4", "the past; formerly"],
  自己: ["zi4 ji3", "oneself"],
  明月: ["ming2 yue4", "bright moon"],
  仿佛: ["fang3 fu2", "as if; seemingly"],
  林间: ["lin2 jian1", "in the forest"],
  影子: ["ying3 zi", "shadow"],
  慢慢: ["man4 man4", "slowly"],
  伏低: ["fu2 di1", "to crouch low"],
  恐惧: ["kong3 ju4", "fear; dread"],
  照见: ["zhao4 jian4", "to illuminate; to see clearly"],
  每一: ["mei3 yi1", "every single"],
  回响: ["hui2 xiang3", "echo; reverberation"],
  命运: ["ming4 yun4", "fate; destiny"],
  山道: ["shan1 dao4", "mountain path"],
  雾散: ["wu4 san4", "fog disperses"],
  迟来: ["chi2 lai2", "belated; late-arriving"],
  回答: ["hui2 da2", "answer; response"],
  夜色: ["ye4 se4", "night scene; darkness"],
  交谈: ["jiao1 tan2", "to converse"],
  沿着: ["yan2 zhe", "along; following"],
  向前: ["xiang4 qian2", "forward"],
  忽然: ["hu1 ran2", "suddenly"],
  明白: ["ming2 bai", "to understand"],
  所谓: ["suo3 wei4", "so-called"],
  归途: ["gui1 tu2", "way home; return path"],
  回到: ["hui2 dao4", "to return to"],
  旧处: ["jiu4 chu4", "old place"],
  有时: ["you3 shi2", "sometimes"],
  终于: ["zhong1 yu2", "finally"],
  看清: ["kan4 qing1", "to see clearly"],
  清晨: ["qing1 chen2", "early morning"],
  石阶: ["shi2 jie1", "stone steps"],
  一层纸: ["yi1 ceng2 zhi3", "a layer of paper"],
  那些: ["na4 xie1", "those"],
  沉重: ["chen2 zhong4", "heavy; weighty"],
  名字: ["ming2 zi", "name"],
  一个一个: ["yi2 ge4 yi2 ge4", "one by one"],
  胸口: ["xiong1 kou3", "chest"],
  松开: ["song1 kai1", "to loosen; release"],
  合上: ["he2 shang4", "to close"],
  书页: ["shu1 ye4", "book page"],
  听见: ["ting1 jian4", "to hear"],
  远处: ["yuan3 chu4", "far away"],
  鸟声: ["niao3 sheng1", "birdsong"],
  重新: ["chong2 xin1", "again; anew"],
  呼吸: ["hu1 xi1", "to breathe"],
  风穿过林: ["feng1 chuan1 guo4 lin2", "the wind passes through the forest"],
  一轮明月: ["yi1 lun2 ming2 yue4", "a bright full moon"],
  看见过去: ["kan4 jian4 guo4 qu4", "to see the past"],
  一声回响: ["yi1 sheng1 hui2 xiang3", "an echo"],
  鬼吹灯: ["gui3 chui1 deng1", "Ghost Blows Out the Light"],
  精绝古城: ["jing1 jue2 gu3 cheng2", "Jingjue Ancient City"],
  盗墓: ["dao4 mu4", "tomb raiding"],
  古城: ["gu3 cheng2", "ancient city"],
  古墓: ["gu3 mu4", "ancient tomb"],
  胡八一: ["hu2 ba1 yi1", "Hu Bayi"],
  王胖子: ["wang2 pang4 zi", "Wang Pangzi"],
  Shirley杨: ["Shirley yang2", "Shirley Yang"],
  大漠: ["da4 mo4", "desert"],
  风水: ["feng1 shui3", "feng shui; geomancy"],
  阴阳: ["yin1 yang2", "yin and yang"],
  秘术: ["mi4 shu4", "secret art"],
  昆仑: ["kun1 lun2", "Kunlun"],
  新疆: ["xin1 jiang1", "Xinjiang"],
  沙漠: ["sha1 mo4", "desert"],
  鬼洞: ["gui3 dong4", "ghost cave"],
  墓室: ["mu4 shi4", "tomb chamber"],
  棺材: ["guan1 cai", "coffin"],
  技术: ["ji4 shu4", "skill; technology"],
  破坏: ["po4 huai4", "to destroy; damage"],
  贵族: ["gui4 zu2", "nobility"],
  坟墓: ["fen2 mu4", "grave; tomb"],
  一: ["yi1", "one"],
  个: ["ge4", "individual; measure word"],
  中: ["zhong1", "middle; China"],
  之: ["zhi1", "of; it"],
  了: ["le", "completed action marker"],
  人: ["ren2", "person"],
  从: ["cong2", "from; follow"],
  他: ["ta1", "he; him"],
  仿: ["fang3", "seem; imitate"],
  佛: ["fu2", "as if"],
  低: ["di1", "low"],
  停: ["ting2", "to stop"],
  像: ["xiang4", "to resemble"],
  光: ["guang1", "light"],
  去: ["qu4", "to go; past"],
  又: ["you4", "again"],
  口: ["kou3", "mouth"],
  名: ["ming2", "name"],
  向: ["xiang4", "toward"],
  吸: ["xi1", "to inhale"],
  呼: ["hu1", "to breathe out"],
  命: ["ming4", "life; fate"],
  回: ["hui2", "to return"],
  在: ["zai4", "at; in"],
  声: ["sheng1", "sound; voice"],
  处: ["chu4", "place"],
  多: ["duo1", "many; much"],
  夜: ["ye4", "night"],
  天: ["tian1", "sky; day"],
  央: ["yang1", "center"],
  己: ["ji3", "self"],
  山: ["shan1", "mountain"],
  川: ["chuan1", "river"],
  开: ["kai1", "to open"],
  心: ["xin1", "heart; mind"],
  恐: ["kong3", "fear"],
  惧: ["ju4", "to fear"],
  我: ["wo3", "I; me"],
  所: ["suo3", "place; that which"],
  成: ["cheng2", "to become"],
  慢: ["man4", "slow"],
  愿: ["yuan4", "to wish"],
  旧: ["jiu4", "old"],
  明: ["ming2", "bright"],
  是: ["shi4", "to be"],
  晨: ["chen2", "morning"],
  月: ["yue4", "moon; month"],
  有: ["you3", "to have"],
  林: ["lin2", "forest"],
  树: ["shu4", "tree"],
  梦: ["meng4", "dream"],
  每: ["mei3", "each; every"],
  沉: ["chen2", "to sink; deep"],
  沿: ["yan2", "along"],
  清: ["qing1", "clear"],
  然: ["ran2", "so; however"],
  照: ["zhao4", "to shine on"],
  片: ["pian4", "piece; slice"],
  白: ["bai2", "white"],
  的: ["de", "possessive particle"],
  看: ["kan4", "to see"],
  石: ["shi2", "stone"],
  等: ["deng3", "to wait"],
  答: ["da2", "to answer"],
  纸: ["zhi3", "paper"],
  自: ["zi4", "self; from"],
  若: ["ruo4", "if; as if"],
  草: ["cao3", "grass"],
  落: ["luo4", "to fall"],
  薄: ["bo2", "thin"],
  虑: ["lv4", "to consider"],
  行: ["xing2", "to walk"],
  被: ["bei4", "passive marker"],
  见: ["jian4", "to see"],
  许: ["xu3", "to allow; perhaps"],
  说: ["shuo1", "to speak"],
  谈: ["tan2", "to talk"],
  走: ["zou3", "to walk"],
  路: ["lu4", "road; path"],
  过: ["guo4", "to pass; past"],
  远: ["yuan3", "far"],
  迟: ["chi2", "late"],
  途: ["tu2", "way; route"],
  道: ["dao4", "road; way"],
  那: ["na4", "that"],
  重: ["zhong4", "heavy"],
  里: ["li3", "inside"],
  归: ["gui1", "to return"],
  雾: ["wu4", "fog"],
  静: ["jing4", "quiet; still"],
  风: ["feng1", "wind"],
  鸟: ["niao3", "bird"]
};

const dictionaryTerms = Object.keys(characterDictionary).sort((a, b) => b.length - a.length);

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
    const savedUserBooks = savedBooks.filter((book) => !bundledTitles.has(book.title));
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
  const userBooks = state.books.filter((book) => !bundledTitles.has(book.title));
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
    const term = dictionaryTerms.find((entry) => remaining.startsWith(entry));
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
}

function hideDefinition() {
  document.querySelectorAll(".reader-term.active").forEach((node) => node.classList.remove("active"));
  document.querySelector("#definitionPopover").hidden = true;
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
