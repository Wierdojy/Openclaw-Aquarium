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
  currentChapter: 0,
  speechState: {
    utterance: null,
    isPlaying: false,
    currentWordIndex: -1,
    wordElements: []
  },
  translations: {} // Cache for translated text
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

let characterDictionary = null;

async function loadDictionary() {
  if (characterDictionary) return characterDictionary;
  if (window.MUYU_DICTIONARY) {
    characterDictionary = { ...window.MUYU_DICTIONARY, ...customDictionary };
    return characterDictionary;
  }
  // Dynamically load dictionary if not already present
  const response = await fetch('dictionary-data.js');
  const text = await response.text();
  const match = text.match(/window\.MUYU_DICTIONARY = (\{.+\});/s);
  if (match) {
    try {
      window.MUYU_DICTIONARY = JSON.parse(match[1]);
      characterDictionary = { ...window.MUYU_DICTIONARY, ...customDictionary };
    } catch (e) {
      console.error('Failed to parse dictionary:', e);
      characterDictionary = customDictionary;
    }
  } else {
    characterDictionary = customDictionary;
  }
  return characterDictionary;
}
let dictionaryTermsByFirstChar = null;

function getDictionaryTermsByFirstChar() {
  if (dictionaryTermsByFirstChar) return dictionaryTermsByFirstChar;
  if (!characterDictionary) return {};
  dictionaryTermsByFirstChar = Object.keys(characterDictionary).reduce((groups, term) => {
    const firstChar = term[0];
    if (!groups[firstChar]) groups[firstChar] = [];
    groups[firstChar].push(term);
    return groups;
  }, {});
  Object.values(dictionaryTermsByFirstChar).forEach((terms) => terms.sort((a, b) => b.length - a.length));
  return dictionaryTermsByFirstChar;
}

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
  
  // Split text into paragraphs (separated by empty lines)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  
  paragraphs.forEach((paragraph, pIndex) => {
    // Create paragraph container
    const p = document.createElement('p');
    p.className = 'reader-paragraph';
    p.dataset.paragraphIndex = pIndex;
    
    let index = 0;
    const paragraphStartIndex = text.indexOf(paragraph);
    
    while (index < paragraph.length) {
      const char = paragraph[index];
      if (isChineseCharacter(char)) {
        const button = document.createElement("button");
        button.className = "reader-term";
        button.type = "button";
        button.textContent = char;
        button.dataset.term = char;
        button.dataset.index = String(paragraphStartIndex + index);
        p.append(button);
      } else {
        p.append(document.createTextNode(char));
      }
      index += 1;
    }
    
    container.append(p);
    
    // Add translate button and container for this paragraph
    const translateBtn = document.createElement('button');
    translateBtn.className = 'translate-btn';
    translateBtn.textContent = '翻译成英文';
    translateBtn.dataset.paragraphText = paragraph;
    translateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTranslation(translateBtn, paragraph);
    });
    container.append(translateBtn);
    
    // Translation container (hidden by default)
    const translationDiv = document.createElement('div');
    translationDiv.className = 'translation';
    translationDiv.hidden = true;
    container.append(translationDiv);
  });
  
  // Start loading dictionary in background for future interactive features
  loadDictionary().catch(console.error);
}

function getBookProgress(bookIndex = state.currentBook) {
  const book = state.books[bookIndex];
  if (!book || !book.chapters.length) return 0;
  return Math.round((state.currentChapter / book.chapters.length) * 100);
}

function renderReader() {
  // Stop any playing speech when changing chapters
  stopSpeech();
  
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
  document.querySelector("#currentExcerpt").textContent = chapter.text.split("\n").find((line) => line.trim()) || "";
  document.querySelector("#currentProgressFill").style.width = `${progress}%`;
  document.querySelector("#currentProgressPath").setAttribute("aria-label", `阅读进度 ${progress}%`);
  renderHomeBooks();
  renderLibrary();
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
  const marked = toneMarks[vowel]?.[tone - 1];
  if (!marked) return base;
  return `${base.slice(0, markIndex)}${marked}${base.slice(markIndex + 1)}`;
}

function formatPinyin(pinyin) {
  return pinyin
    .split(/(\s+|-)/)
    .map((part) => (/[\s-]+/.test(part) ? part : markPinyinSyllable(part)))
    .join("");
}

function showDefinition(target) {
  const term = target.dataset.term;
  const [pinyin, meaning] = characterDictionary[term] || [t("unknownPinyin"), t("unknownMeaning")];
  const popover = document.querySelector("#definitionPopover");
  // Don't remove .active class if speech is playing - that's used for TTS highlighting
  if (!state.speechState.isPlaying) {
    document.querySelectorAll(".reader-term.active").forEach((node) => node.classList.remove("active"));
  }
  target.classList.add("active");
  document.querySelector("#definitionChar").textContent = term;
  document.querySelector("#definitionPinyin").textContent = formatPinyin(pinyin);
  document.querySelector("#definitionMeaning").textContent = meaning;
  popover.hidden = false;
  positionDefinitionPopover(target, popover);
}

function hideDefinition() {
  // Don't hide definition if speech is playing
  if (state.speechState.isPlaying) return;
  document.querySelectorAll(".reader-term.active").forEach((node) => node.classList.remove("active"));
  document.querySelector("#definitionPopover").hidden = true;
}

// TTS Functions
function getReaderTermAt(index) {
  return document.querySelector(`#readerText .reader-term[data-index="${index}"]`);
}

function clearSpeechHighlight() {
  document.querySelectorAll(".reader-term.speaking").forEach((node) => {
    node.classList.remove("speaking");
  });
}

function updateSpeechHighlight(index) {
  clearSpeechHighlight();
  const target = getReaderTermAt(index);
  if (target) {
    target.classList.add("speaking");
    state.speechState.currentWordIndex = index;
    // Scroll into view if needed
    target.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
}

function stopSpeech() {
  if (state.speechState.utterance) {
    speechSynthesis.cancel();
    state.speechState.utterance = null;
  }
  if (state.speechState.speakInterval) {
    clearInterval(state.speechState.speakInterval);
    state.speechState.speakInterval = null;
  }
  state.speechState.isPlaying = false;
  state.speechState.currentWordIndex = -1;
  // Clear all speaking highlights
  document.querySelectorAll(".reader-term.speaking").forEach((node) => {
    node.classList.remove("speaking");
  });
  updateSpeechUI();
}

function updateSpeechUI() {
  const playBtn = document.querySelector("#playSpeech");
  const pauseBtn = document.querySelector("#pauseSpeech");
  if (state.speechState.isPlaying) {
    playBtn.hidden = true;
    pauseBtn.hidden = false;
  } else {
    playBtn.hidden = false;
    pauseBtn.hidden = true;
  }
}

function speakChapter() {
  // Stop any current speech
  stopSpeech();
  
  const book = state.books[state.currentBook];
  const chapter = book.chapters[state.currentChapter];
  
  if (!chapter || !chapter.text) return;
  
  state.speechState.currentWordIndex = 0;
  
  // Create utterance with Chinese text
  const utterance = new SpeechSynthesisUtterance(chapter.text);
  utterance.lang = 'zh-CN';
  
  // Try to find a Chinese voice
  const voices = speechSynthesis.getVoices();
  const chineseVoice = voices.find(v => v.lang.startsWith('zh'));
  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }
  
  // Track word boundaries if supported
  utterance.onboundary = (event) => {
    if (event.name === 'word' || event.name === 'sentence') {
      if (typeof event.charIndex === 'number') {
        updateSpeechHighlight(event.charIndex);
      }
    }
  };
  
  utterance.onend = () => {
    state.speechState.isPlaying = false;
    state.speechState.utterance = null;
    if (state.speechState.speakInterval) {
      clearInterval(state.speechState.speakInterval);
      state.speechState.speakInterval = null;
    }
    updateSpeechUI();
    clearSpeechHighlight();
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    state.speechState.isPlaying = false;
    state.speechState.utterance = null;
    if (state.speechState.speakInterval) {
      clearInterval(state.speechState.speakInterval);
      state.speechState.speakInterval = null;
    }
    updateSpeechUI();
  };
  
  state.speechState.utterance = utterance;
  state.speechState.isPlaying = true;
  
  // Fallback: If onboundary doesn't fire reliably (common with Chinese text),
  // use a manual timing approach based on text length
  const intervalMs = 300; // ~300ms per character for Chinese
  
  state.speechState.speakInterval = setInterval(() => {
    if (state.speechState.isPlaying && state.speechState.currentWordIndex < chapter.text.length) {
      updateSpeechHighlight(state.speechState.currentWordIndex);
      // Find next Chinese character index
      let nextIndex = state.speechState.currentWordIndex + 1;
      while (nextIndex < chapter.text.length && !isChineseCharacter(chapter.text[nextIndex])) {
        nextIndex++;
      }
      state.speechState.currentWordIndex = nextIndex;
    } else {
      clearInterval(state.speechState.speakInterval);
      state.speechState.speakInterval = null;
    }
  }, intervalMs);
  
  speechSynthesis.speak(utterance);
  updateSpeechUI();
}

function pauseSpeech() {
  if (state.speechState.isPlaying) {
    speechSynthesis.pause();
    state.speechState.isPlaying = false;
    // Also pause the highlight interval
    if (state.speechState.speakInterval) {
      clearInterval(state.speechState.speakInterval);
      state.speechState.speakInterval = null;
    }
    updateSpeechUI();
  }
}

function resumeSpeech() {
  if (!state.speechState.isPlaying && state.speechState.utterance) {
    speechSynthesis.resume();
    state.speechState.isPlaying = true;
    updateSpeechUI();
  }
}

// Translation Functions
async function translateText(text, targetLang = 'en') {
  // Check cache first
  const cacheKey = `${text.substring(0, 100)}_${targetLang}`;
  if (state.translations[cacheKey]) {
    return state.translations[cacheKey];
  }

  try {
    // Use MyMemory Translation API (free, no key required)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh|${targetLang}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.responseStatus && data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'Translation failed');
    }

    const translation = data.responseData?.translatedText || text;
    
    // Cache the result
    state.translations[cacheKey] = translation;
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

async function toggleTranslation(buttonEl, paragraphText) {
  const translationDiv = buttonEl.nextElementSibling;
  
  if (translationDiv && translationDiv.classList.contains('translation')) {
    // Toggle existing translation
    translationDiv.hidden = !translationDiv.hidden;
    buttonEl.textContent = translationDiv.hidden ? '翻译成英文' : '隐藏翻译';
    return;
  }
  
  // Create new translation
  const newTranslationDiv = document.createElement('div');
  newTranslationDiv.className = 'translation';
  newTranslationDiv.textContent = '翻译中...';
  
  // Insert after the button
  buttonEl.parentNode.insertBefore(newTranslationDiv, buttonEl.nextSibling);
  
  try {
    const translation = await translateText(paragraphText);
    newTranslationDiv.textContent = translation;
    buttonEl.textContent = '隐藏翻译';
  } catch (error) {
    newTranslationDiv.textContent = '翻译失败，请重试。';
    newTranslationDiv.classList.add('error');
    console.error('Translation failed:', error);
  }
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
  // Stop speech when leaving the reader view
  if (viewName !== "reader" && state.activeView === "reader") {
    stopSpeech();
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
  loadDictionary().then(() => showDefinition(target)).catch(console.error);
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

// Speech control event listeners
document.querySelector("#playSpeech").addEventListener("click", () => {
  if (!state.speechState.isPlaying) {
    if (speechSynthesis.paused) {
      resumeSpeech();
    } else {
      speakChapter();
    }
  }
});

document.querySelector("#pauseSpeech").addEventListener("click", () => {
  pauseSpeech();
});

document.querySelector("#stopSpeech").addEventListener("click", () => {
  stopSpeech();
});

// Load voices when they become available
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    // Voices loaded
  };
}

function renderAll() {
  applyLanguage();
  renderHomeBooks();
  renderLibrary();
  renderReader();
}

setDateLabel();
renderAll();
