import type { FingerprintComponentValue } from './fingerprint';

export interface Source {
  readonly key: string;
  collect(): Promise<FingerprintComponentValue> | FingerprintComponentValue;
}
