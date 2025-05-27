import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const KEY = 'timezone';
export class TimezoneInfoSource implements Source {
  public readonly key = KEY;
  collect(): FingerprintComponentValue {
    const date = new Date();

    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: date.getTimezoneOffset(),
    };
  }
}
