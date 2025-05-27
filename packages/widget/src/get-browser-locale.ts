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
