import Browser from '../browser/browser';
import BrowserPrivacyProtectionKind from '../browser/types/browser-privacy-protection-kind';
import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

export interface LanguageStatus {
  language: string;
  languages: string[] | undefined;
}

const KEY = 'language';
export class LanguageSource implements Source {
  public readonly key = KEY;
  public collect(): FingerprintComponentValue {
    let languages = undefined;
    if (!Browser.isSourcePrivacyProtected(BrowserPrivacyProtectionKind.Language)) {
      if (Array.isArray(navigator.languages)) {
        languages = navigator.languages;
      } else if (typeof navigator.languages === 'string') {
        languages = (navigator.languages as string).split(',');
      }
    }

    return {
      language: navigator.language,
      languages: languages,
    };
  }
}
