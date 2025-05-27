import Browser from '../browser/browser';
import BrowserPrivacyProtectionKind from '../browser/types/browser-privacy-protection-kind';
import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

export interface PluginStatus {
  items: PluginArray | undefined;
  length: number | undefined;
}
const KEY = 'plugins';
export class PluginsSource implements Source {
  public readonly key = KEY;
  collect(): FingerprintComponentValue {
    // brave fakes plugins
    if (Browser.isSourcePrivacyProtected(BrowserPrivacyProtectionKind.Plugins)) {
      return undefined;
    }
    return {
      items: navigator.plugins,
      length: navigator.plugins?.length,
    };
  }
}
