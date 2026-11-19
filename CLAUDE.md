# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static promotional website for the iCook4U iOS app. Three pages: `index.html` (landing), `privacy.html`, `support.html`. No build step, no dependencies — works from `file://` or any static host.

## Preview

```sh
python3 -m http.server 8000   # http://localhost:8000
```

## Configuration

All site-wide settings live in `assets/config.js` (`window.ICOOK_CONFIG`):
- `APP_STORE_URL` — while `"#"`, download buttons show "Coming soon to the App Store"; once set to a real URL, they show Apple's localized badge (loaded from `tools.applemarketingtools.com`, with a text fallback).
- `SUPPORT_EMAIL` — shown on the support page.
- `PRIVACY_EFFECTIVE_DATE` — formatted per locale on the privacy page via `Intl.DateTimeFormat`.

## Architecture

**i18n** (`assets/i18n.js` + `assets/site.js`): All UI text lives in `window.ICOOK_I18N` as one object per language (`en`, `bg`, `de`, `fr`, `es`, `it`, `ru`, `hi`, `zh-Hans`, `ja`). HTML elements reference keys via `data-i18n="key"` (text content) or `data-i18n-attr="attr:key;attr:key"` (attributes like `alt`, `aria-label`). Language priority: `?lang=xx` query param → `localStorage` → `navigator.languages` → `en`.

**Screenshots** (`screenshots/<lang>/<name>.jpg`): `site.js` sets `img[data-shot]` src to `screenshots/<lang>/<name>.jpg` and falls back to `screenshots/en/<name>.jpg` on error. Six scenes per language: `home`, `discover`, `recipe`, `nutrition`, `kitchen`, `creami`.

**Internal links** that should carry the language (`support.html`, `privacy.html`) use `data-keep-lang` — `site.js` appends `?lang=<current>` automatically.

## Capturing screenshots

```sh
scripts/capture-screenshots.sh           # all 10 languages
scripts/capture-screenshots.sh en bg     # specific languages
```

The script builds a Debug iOS build, sets the simulator status bar to 9:41, and saves 640 px wide JPEGs. Requires Xcode and a simulator.

## Adding or updating translations

Edit `assets/i18n.js`. Missing keys in a language automatically fall back to English — partial translations are safe. App-facing terms (tier names, macro names, "What's in my kitchen?") must match `Localizable.xcstrings` in the iOS app exactly.
