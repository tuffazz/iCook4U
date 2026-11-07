(() => {
  const config = window.ICOOK_CONFIG || {};
  const dict = window.ICOOK_I18N || {};
  const languages = window.ICOOK_LANGUAGES || [];
  const codes = languages.map((l) => l.code);
  const STORAGE_KEY = "icook4u.lang";

  const storage = {
    get() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* private mode */ } },
  };

  // "zh-CN", "zh-Hans-CN", "zh" → "zh-Hans"; "de-AT" → "de".
  function match(tag) {
    if (!tag) return null;
    const lower = tag.toLowerCase();
    if (lower.startsWith("zh")) return "zh-Hans";
    const exact = codes.find((c) => c.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split("-")[0];
    return codes.find((c) => c.toLowerCase() === base) || null;
  }

  function detectLanguage() {
    const fromQuery = match(new URLSearchParams(location.search).get("lang"));
    if (fromQuery) return fromQuery;
    const saved = match(storage.get());
    if (saved) return saved;
    for (const tag of navigator.languages || [navigator.language]) {
      const m = match(tag);
      if (m) return m;
    }
    return "en";
  }

  const t = (lang, key) => (dict[lang] && dict[lang][key]) || (dict.en && dict.en[key]) || "";

  function apply(lang) {
    const page = document.body.dataset.page || "home";
    document.documentElement.lang = lang;
    document.title = t(lang, page === "home" ? "meta.title" : `meta.${page}`);
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t(lang, "meta.description"));

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(lang, el.dataset.i18n);
    });
    // data-i18n-attr="alt:shot.home;aria-label:nav.features"
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        if (attr && key) el.setAttribute(attr.trim(), t(lang, key.trim()));
      });
    });

    // Localized screenshots, falling back to English when a language hasn't been captured.
    document.querySelectorAll("img[data-shot]").forEach((img) => {
      const name = img.dataset.shot;
      img.onerror = () => {
        img.onerror = null;
        img.src = `screenshots/en/${name}.jpg`;
      };
      img.src = `screenshots/${lang}/${name}.jpg`;
    });

    // Keep internal links in the chosen language.
    document.querySelectorAll("a[data-keep-lang]").forEach((a) => {
      const url = new URL(a.getAttribute("href"), location.href);
      url.searchParams.set("lang", lang);
      a.href = url.pathname.split("/").pop() + url.search + url.hash;
    });

    const date = document.querySelector("[data-effective-date]");
    if (date && config.PRIVACY_EFFECTIVE_DATE) {
      const d = new Date(`${config.PRIVACY_EFFECTIVE_DATE}T12:00:00`);
      date.textContent = new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(d);
      date.setAttribute("datetime", config.PRIVACY_EFFECTIVE_DATE);
    }

    setupAppStore(lang);

    const select = document.querySelector("[data-language-select]");
    if (select) select.value = lang;
  }

  function setupAppStore(lang) {
    const url = (config.APP_STORE_URL || "").trim();
    const live = url !== "" && url !== "#";
    const badgeLocale = (languages.find((l) => l.code === lang) || {}).badge || "en-us";

    document.querySelectorAll("[data-appstore]").forEach((el) => {
      el.classList.toggle("is-live", live);
      el.classList.toggle("is-soon", !live);
      const link = el.querySelector("a");
      const img = el.querySelector("img");
      if (live) {
        link.href = url;
        link.removeAttribute("aria-disabled");
        link.setAttribute("aria-label", t(lang, "cta.download"));
        img.alt = t(lang, "cta.download");
        img.onerror = () => {
          if (!img.src.endsWith("/en-us")) { img.src = img.src.replace(/\/[a-z-]+$/, "/en-us"); return; }
          el.classList.add("badge-failed");
        };
        img.src = `https://tools.applemarketingtools.com/api/badges/download-on-the-app-store/black/${badgeLocale}`;
      } else {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.removeAttribute("aria-label");
      }
    });
  }

  function setupEmail() {
    const email = config.SUPPORT_EMAIL || "";
    document.querySelectorAll("[data-email]").forEach((el) => {
      el.href = `mailto:${email}?subject=${encodeURIComponent("iCook4U")}`;
      if (el.dataset.email === "text") el.textContent = email;
    });
  }

  function setupLanguageSelect() {
    const select = document.querySelector("[data-language-select]");
    if (!select) return;
    select.innerHTML = "";
    for (const l of languages) {
      const opt = document.createElement("option");
      opt.value = l.code;
      opt.lang = l.code;
      opt.textContent = l.name;
      select.append(opt);
    }
    select.addEventListener("change", () => {
      const lang = select.value;
      storage.set(lang);
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url);
      apply(lang);
    });
  }

  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  setupLanguageSelect();
  setupEmail();
  apply(detectLanguage());
})();
