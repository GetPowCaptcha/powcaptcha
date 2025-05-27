import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const KEY = 'webdriver';
export class WebDriverSource implements Source {
  public readonly key = KEY;
  public collect(): FingerprintComponentValue {
    return navigator.webdriver;
  }
}
