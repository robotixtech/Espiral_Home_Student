/**
 * Minimal i18n module for Espiral Home Student.
 *
 * Language resolution order (first match wins):
 *   1. URL parameter `?lang=XX` — set by Moodle when embedding the iframe.
 *      See MOODLE_INTEGRATION.md § Internacionalización for configuration steps.
 *   2. Browser language (`navigator.language`).
 *   3. Default: 'es'.
 *
 * Moodle language codes use the format 'es', 'en', 'ca', 'es_wp', etc.
 * The resolver normalises them to the base ISO 639-1 code (first segment before '_').
 *
 * To add a new language: add a new key to `translations` below.
 * To add a new translatable string: add the key to every existing locale entry.
 */

// ── Translations ─────────────────────────────────────────────────────────────

const translations: Record<string, Record<string, string>> = {
  es: {
    badgesPanelLabel:    'INSIGNIAS',
    badgesEarnedLabel:   'OBTENIDAS',
    badgesPanelAriaLabel: 'Panel de insignias',
    badgeEarnedSuffix:   'Insignia obtenida',
    badgeLockedSuffix:   'Sin obtener',
  },
  en: {
    badgesPanelLabel:    'BADGES',
    badgesEarnedLabel:   'EARNED',
    badgesPanelAriaLabel: 'Badge panel',
    badgeEarnedSuffix:   'Badge earned',
    badgeLockedSuffix:   'Not yet earned',
  },
  ca: {
    badgesPanelLabel:    'INSÍGNIES',
    badgesEarnedLabel:   'OBTINGUDES',
    badgesPanelAriaLabel: 'Tauler d\'insígnies',
    badgeEarnedSuffix:   'Insígnia obtinguda',
    badgeLockedSuffix:   'Sense obtenir',
  },
  fr: {
    badgesPanelLabel:    'BADGES',
    badgesEarnedLabel:   'OBTENUS',
    badgesPanelAriaLabel: 'Panneau de badges',
    badgeEarnedSuffix:   'Badge obtenu',
    badgeLockedSuffix:   'Non obtenu',
  },
  de: {
    badgesPanelLabel:    'ABZEICHEN',
    badgesEarnedLabel:   'ERHALTEN',
    badgesPanelAriaLabel: 'Abzeichen-Panel',
    badgeEarnedSuffix:   'Abzeichen erhalten',
    badgeLockedSuffix:   'Noch nicht erhalten',
  },
  pt: {
    badgesPanelLabel:    'INSÍGNIAS',
    badgesEarnedLabel:   'OBTIDAS',
    badgesPanelAriaLabel: 'Painel de insígnias',
    badgeEarnedSuffix:   'Insígnia obtida',
    badgeLockedSuffix:   'Não obtida',
  },
  eu: {
    badgesPanelLabel:    'TXAPAK',
    badgesEarnedLabel:   'LORTUTAKO',
    badgesPanelAriaLabel: 'Txapen panela',
    badgeEarnedSuffix:   'Txapa lortua',
    badgeLockedSuffix:   'Lortu gabe',
  },
};

// ── Locale resolution ─────────────────────────────────────────────────────────

const DEFAULT_LOCALE = 'es';

function resolveLocale(): string {
  // 1. ?lang= URL parameter (Moodle-injected — see MOODLE_INTEGRATION.md)
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang) {
    // Normalise Moodle codes like 'es_wp', 'en_us' → base ISO 639-1 code.
    const base = urlLang.split('_')[0].toLowerCase();
    if (translations[base]) return base;
  }

  // 2. Browser language fallback
  const browserBase = navigator.language?.split('-')[0].toLowerCase();
  if (browserBase && translations[browserBase]) return browserBase;

  return DEFAULT_LOCALE;
}

const _locale = resolveLocale();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the translation for `key` in the resolved locale.
 * Falls back to the default locale if the key is missing, then to the key itself.
 */
export function t(key: string): string {
  return translations[_locale]?.[key]
    ?? translations[DEFAULT_LOCALE]?.[key]
    ?? key;
}

/** The resolved ISO 639-1 locale code (e.g. 'es', 'en', 'ca'). */
export const locale: string = _locale;
