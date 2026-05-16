import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Lang, LANGUAGES, TRANSLATIONS } from './translations';

const STORAGE_KEY = 'yva.lang';
const DEFAULT_LANG: Lang = 'en';

/**
 * Runtime i18n. Switching `lang` flips every translated string instantly —
 * the dictionary is a `computed` signal so any template that calls `t()`
 * (or uses the | translate pipe) re-renders without a reload.
 *
 * SSR-safe: localStorage is gated on `isPlatformBrowser`.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _lang = signal<Lang>(this.detectInitial());

  readonly lang = this._lang.asReadonly();
  readonly languages = LANGUAGES;

  /** Reactive dictionary — recomputes when lang changes. */
  private readonly dict = computed(() => TRANSLATIONS[this._lang()]);

  /** The "next" language for the toggle button — flips between en/fr. */
  readonly otherLanguage = computed(() => {
    const cur = this._lang();
    return LANGUAGES.find((l) => l.code !== cur) ?? LANGUAGES[0];
  });

  /** Look up a translation. Reads `dict()` so callers stay reactive. */
  t(key: string): string {
    return this.dict()[key] ?? key;
  }

  setLang(lang: Lang): void {
    if (lang === this._lang()) return;
    this._lang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* quota / private mode */ }
      document.documentElement.lang = lang;
    }
  }

  /** Convenience for the header button. */
  toggle(): void {
    this.setLang(this.otherLanguage().code);
  }

  private detectInitial(): Lang {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_LANG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored && (stored === 'en' || stored === 'fr')) return stored;
    } catch { /* ignore */ }
    const nav = (navigator?.language ?? '').toLowerCase();
    return nav.startsWith('fr') ? 'fr' : DEFAULT_LANG;
  }
}
