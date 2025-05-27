import { Browser } from '../browser';
import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const KEY = 'browser';

export class BrowserSource implements Source {
  public readonly key = KEY;
  public collect(): FingerprintComponentValue {
    return Browser.getInfo();
  }
}
