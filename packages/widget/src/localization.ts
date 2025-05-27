import { createLogger } from '@powcaptcha/logger';
const Logger = createLogger('widget:localization');

// Storage for loaded translations
const loadedLocales: Record<string, Record<string, string>> = {};
let currentLocale = 'en'; // Default language

// Initial load of the default language (English)
import enMessages from './locales/en';

loadedLocales.en = enMessages;

/**
 * Dynamically loads the data for a specific language.
 * Vite/Rollup will create separate chunks for each file in ./locales/
 * @param locale - The language code to load (e.g., "es", "ca")
 * @returns {Promise<boolean>} - True if successfully loaded, false otherwise.
 */
export async function loadLocale(locale: string): Promise<string | false> {
  locale = locale.toLowerCase();
  if (loadedLocales[locale]) {
    Logger.log(`Locale '${locale}' already loaded.`);
    return locale;
  }

  const loadLocaleInternal = async (locale: string) => {
    const messagesModule = (await import(`./locales/${locale}.ts`)) as {
      default: Record<string, string>;
    };
    loadedLocales[locale] = messagesModule.default;
    Logger.log(`Successfully loaded locale '${locale}'.`);
    return locale;
  };

  try {
    return await loadLocaleInternal(locale);
  } catch {
    try {
      const localeParts = locale.split('-');
      const baseLocale = localeParts[0];
      return await loadLocaleInternal(baseLocale);
    } catch (error) {
      Logger.error(`Failed to load base locale:`, error);
      return false;
    }
  }
}

export function setLocale(locale: string) {
  if (typeof locale !== 'string') {
    console.warn('powCaptcha Localization: No locale provided.', locale);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(loadedLocales, locale)) {
    currentLocale = locale;
    return;
  }

  const localeParts = locale.split('-');
  const baseLocale = localeParts[0];

  currentLocale =
    baseLocale && Object.prototype.hasOwnProperty.call(loadedLocales, baseLocale)
      ? baseLocale
      : 'en';
}

export function t(key: string): string {
  return loadedLocales[currentLocale]?.[key] || loadedLocales.en?.[key] || key;
}

export function getBrowserLocale(): string {
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.toLowerCase();
    } else {
      return 'en';
    }
  } catch {
    return 'en';
  }
}
