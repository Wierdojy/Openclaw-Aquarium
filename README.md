# 沐浴 Chinese Reader 🛁

A modern web reader for Chinese literature, built with the help of Codex.

沐浴 (Mùyù) means "to bathe" — immerse yourself in Chinese literature.

## Features (Planned)

- 📚 **Book Library** — Browse and read Chinese novels
- 🔍 **Full-Text Search** — Find quotes, characters, plot points instantly
- 📖 **Reader Mode** — Clean, scrollable text with minimal UI
- 🌙 **Dark Mode** — Easy on the eyes during late-night reading
- 📱 **Responsive** — Works on desktop and mobile
- 🇨🇳 **Chinese-First** — Optimized for CJK text rendering

## Project Structure

```
Muyu-Chinese-Reader/
├── book/                      # Novel text files (plain text)
│   └── 鬼吹灯_精绝古城.txt   # Sample: Ghost Blows Out the Lamp (Book 1)
├── app/                        # Application source code (Codex workspace)
│   ├── components/            # UI components
│   ├── pages/                # Reader, library, search pages
│   └── ...                   # Routes, utils, styles
├── public/                    # Static assets
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm / pnpm / yarn

### Development

1. Clone the repo
   ```bash
   git clone https://github.com/Wierdojy/Muyu-Chinese-Reader.git
   cd Muyu-Chinese-Reader
   ```

2. Install dependencies
   ```bash
   cd app
   npm install
   ```

3. Run the dev server
   ```bash
   npm run dev
   ```

4. Open <http://localhost:3000> in your browser

## Current Book

The repo currently includes:

**《鬼吹灯之精绝古城》** (Ghost Blows Out the Lamp: The Essence of the Ancient City)  
by 天下霸唱 — A classic Chinese adventure novel about tomb-raiding, ancient mysteries, and the supernatural.

More books coming soon! 📚

## Contributing

This project is under active development with Codex. Feel free to open issues or PRs.

---

*沐浴 Chinese Reader — Dive into Chinese literature.* 🛁
