# iCook4U website

Static promo site for iCook4U: `index.html` (landing page), `privacy.html` (Privacy Policy URL for App Store Connect) and `support.html` (Support URL). Plain HTML/CSS/JS with no build step and no dependencies. It works from `file://` and on any static host.

## Set the App Store link

Edit `assets/config.js`:

```js
APP_STORE_URL: "https://apps.apple.com/app/id0000000000",
SUPPORT_EMAIL: "you@yourdomain.com",
```

While `APP_STORE_URL` is `"#"`, every download button shows "Coming soon to the App Store". Once it's set, they show Apple's official localized "Download on the App Store" badge (loaded from `tools.applemarketingtools.com`) and link to the store. If the badge can't load, a text button is shown instead. Optionally also add the Smart App Banner meta tag (see the TODO in `index.html`).

## Languages

All text is in `assets/i18n.js`, one object per language (en, bg, de, fr, es, it, ru, hi, zh-Hans, ja), and elements reference it with `data-i18n="key"`. The language comes from `?lang=xx` first, then the visitor's last choice, then the browser languages, then English. Terms that also appear in the app (tier names, macro names, "What's in my kitchen?") use the same wording as `Localizable.xcstrings`.

## Screenshots

`screenshots/<lang>/{home,discover,recipe,nutrition,kitchen,creami}.jpg` are captured from the simulator through the app's DEBUG deep-link arguments:

```sh
website/scripts/capture-screenshots.sh          # all 10 languages
website/scripts/capture-screenshots.sh en bg    # just these
```

The script builds a Debug build, overrides the status bar to 9:41, launches each scene and saves 640 px wide JPEGs. If a language is missing, the page falls back to the English screenshots.

## Preview and deploy

```sh
python3 -m http.server -d website 8000   # http://localhost:8000
```

To deploy, upload the contents of `website/` to any static host (GitHub Pages, Netlify, Cloudflare Pages). `scripts/` and this README don't need to be published.
