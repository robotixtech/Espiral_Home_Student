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
  // ════════════════════════════════════════════════════════════════
  // CÓMO AÑADIR O EDITAR TRADUCCIONES
  // ────────────────────────────────────────────────────────────────
  // 1. Cada bloque { } es un idioma (es, en, ca, fr, de, pt, eu…).
  // 2. Cada línea es una clave: 'clave': 'texto visible'.
  // 3. Si añades una clave nueva, añádela en TODOS los idiomas.
  // 4. Para añadir un idioma nuevo, copia el bloque 'es' completo
  //    y cambia el código (ej: 'it' para italiano).
  // ════════════════════════════════════════════════════════════════

  es: {
    // ── Panel de insignias ───────────────────────────────────────
    badgesPanelTitle:     'Mis insignias',      // Título principal del panel
    badgesPanelAriaLabel: 'Panel de insignias', // Texto para lectores de pantalla
    badgeEarnedSuffix:    'Insignia obtenida',  // Tooltip al pasar el ratón (ganada)
    badgeLockedSuffix:    'Sin obtener',        // Tooltip al pasar el ratón (bloqueada)
    // Claves legacy (usadas en alt de imágenes y aria internos) — no eliminar
    badgesPanelLabel:    'INSIGNIAS',
    badgesEarnedLabel:   'OBTENIDAS',
  },
  en: {
    // ── Badge panel ──────────────────────────────────────────────
    badgesPanelTitle:     'My badges',
    badgesPanelAriaLabel: 'Badge panel',
    badgeEarnedSuffix:    'Badge earned',
    badgeLockedSuffix:    'Not yet earned',
    badgesPanelLabel:    'BADGES',
    badgesEarnedLabel:   'EARNED',
  },
  ca: {
    // ── Tauler d'insígnies ───────────────────────────────────────
    badgesPanelTitle:     'Les meves insígnies',
    badgesPanelAriaLabel: 'Tauler d\'insígnies',
    badgeEarnedSuffix:    'Insígnia obtinguda',
    badgeLockedSuffix:    'Sense obtenir',
    badgesPanelLabel:    'INSÍGNIES',
    badgesEarnedLabel:   'OBTINGUDES',
  },
  fr: {
    // ── Panneau de badges ────────────────────────────────────────
    badgesPanelTitle:     'Mes badges',
    badgesPanelAriaLabel: 'Panneau de badges',
    badgeEarnedSuffix:    'Badge obtenu',
    badgeLockedSuffix:    'Non obtenu',
    badgesPanelLabel:    'BADGES',
    badgesEarnedLabel:   'OBTENUS',
  },
  de: {
    // ── Abzeichen-Panel ──────────────────────────────────────────
    badgesPanelTitle:     'Meine Abzeichen',
    badgesPanelAriaLabel: 'Abzeichen-Panel',
    badgeEarnedSuffix:    'Abzeichen erhalten',
    badgeLockedSuffix:    'Noch nicht erhalten',
    badgesPanelLabel:    'ABZEICHEN',
    badgesEarnedLabel:   'ERHALTEN',
  },
  pt: {
    // ── Painel de insígnias ──────────────────────────────────────
    badgesPanelTitle:     'As minhas insígnias',
    badgesPanelAriaLabel: 'Painel de insígnias',
    badgeEarnedSuffix:    'Insígnia obtida',
    badgeLockedSuffix:    'Não obtida',
    badgesPanelLabel:    'INSÍGNIAS',
    badgesEarnedLabel:   'OBTIDAS',
  },
  eu: {
    // ── Txapen panela ────────────────────────────────────────────
    badgesPanelTitle:     'Nire txapak',
    badgesPanelAriaLabel: 'Txapen panela',
    badgeEarnedSuffix:    'Txapa lortua',
    badgeLockedSuffix:    'Lortu gabe',
    badgesPanelLabel:    'TXAPAK',
    badgesEarnedLabel:   'LORTUTAKO',
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
