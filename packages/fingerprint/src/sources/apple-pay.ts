import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

export const enum ApplePayStatus {
  NOT_SUPPORTED = 0,
  ERROR = 1,
  AVAILABLE = 2,
  UNAVAILABLE = 3,
}

const KEY = 'applePay';

export class ApplePaySource implements Source {
  public readonly key = KEY;
  public collect(): FingerprintComponentValue {
    try {
      if (!window || !window.ApplePaySession) {
        return ApplePayStatus.NOT_SUPPORTED;
      }
      const canMakePayments =
        window.ApplePaySession.canMakePayments &&
        typeof window.ApplePaySession.canMakePayments === 'function';

      if (canMakePayments && window.ApplePaySession.canMakePayments()) {
        return ApplePayStatus.AVAILABLE;
      }

      return ApplePayStatus.UNAVAILABLE;
    } catch {
      return ApplePayStatus.ERROR;
    }
  }
}
