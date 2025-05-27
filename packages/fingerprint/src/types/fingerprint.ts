export type FingerprintComponentValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Record<string, any>
  | { error: string };

/**
 * Object containing all the collected components,
 * mapping the source key to its value.
 */
export type FingerprintComponents = Record<string, FingerprintComponentValue>;

/**
 * The final result of the fingerprinting process.
 */
export interface FingerprintResult {
  /**
   * The generated fingerprint identifier (SHA-256 hash in hexadecimal).
   */
  fingerprintId: string;

  /**
   * The individual components used to generate the hash.
   * Useful for debugging or analysis. Undefined values are omitted.
   */
  components: FingerprintComponents;

  /**
   * Total collection duration in milliseconds.
   */
  duration: number;
}
