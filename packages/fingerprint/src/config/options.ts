/**
 * Configuration options for fingerprint generation.
 */
export interface FingerprintOptions {
  /**
   * List of source keys to exclude from collection.
   * @default []
   */
  excludeSources?: string[];

  /**
   * Maximum time in milliseconds to wait for *each* individual source
   * to complete. If exceeded, that source will be marked as 'timeout'.
   * Set to 0 to disable per-source timeout.
   * @default 500
   */
  sourceTimeout?: number;

  /**
   * Enable debug mode to see detailed logs in the console.
   * @default false
   */
  debug?: boolean;
}
