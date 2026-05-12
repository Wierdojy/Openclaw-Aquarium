# 沐浴读书

沐浴读书 is a calm mobile-first Chinese reading web app.

## Features

- Chinese/English UI toggle
- Tap words or characters for pinyin and English definitions
- Multi-character dictionary matching for words and idioms
- Offline CC-CEDICT dictionary lookup
- Reading time tracking with a weekly rhythm chart
- Saved display name and per-book progress in localStorage
- Book source files organized under `book/`

## Project Structure

- `app/` contains the static web app files.
- `book/` contains source `.txt` book files.
- `dictionary/` contains the CC-CEDICT source dictionary.
- `scripts/build-book-data.js` converts text files in `book/` into `app/book-data.js`.
- `scripts/build-dictionary-data.js` converts CC-CEDICT into `app/dictionary-data.js`.

## Rebuild Book Data

Run these after changing files in `book/` or `dictionary/`:

```bash
node scripts/build-book-data.js
node scripts/build-dictionary-data.js
```

Then open `app/index.html` through any static web server.

## Dictionary Attribution

Dictionary data comes from CC-CEDICT, a community-maintained Chinese-English dictionary.
