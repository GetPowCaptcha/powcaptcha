import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const KEY = 'prefersReducedMotion';
export class PrefersReducedMotionSource implements Source {
  public readonly key = KEY;
  collect(): FingerprintComponentValue {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return true;
      }
      if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        return false;
      }
    }

    return undefined;
  }
}
