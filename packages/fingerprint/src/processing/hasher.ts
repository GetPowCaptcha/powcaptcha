import { sha256 } from '@powcaptcha/crypto';

import type { FingerprintComponents, FingerprintComponentValue } from '../types/fingerprint';

/**
 * Generates a SHA-256 hash based on the provided fingerprint components and additional data.
 *
 * @param components - An object containing fingerprint components to be hashed.
 * @param excludeSources - An optional array of keys to exclude from the fingerprint components.
 * @param extraData - An optional object containing additional data to include in the hash.
 * @returns A promise that resolves to the generated hash string.
 */
export async function generateHash(
  components: FingerprintComponents,
  excludeSources: string[] = [],
  extraData: Record<string, string> = {}
): Promise<string> {
  const filteredComponents: Record<string, FingerprintComponentValue> = {};
  const sortedKeys = Object.keys(components).sort();

  for (const key of sortedKeys) {
    if (excludeSources.includes(key)) continue;
    filteredComponents[key] = components[key];
  }

  // sort extraData keys if it is an object
  if (extraData && typeof extraData === 'object') {
    const sortedExtraDataKeys = Object.keys(extraData).sort();
    const sortedExtraData: Record<string, string> = {};
    for (const key of sortedExtraDataKeys) {
      sortedExtraData[key] = extraData[key];
    }
    extraData = sortedExtraData;
  }

  const componentsString = JSON.stringify(filteredComponents, null, 0);
  const extraDataString = JSON.stringify(extraData, null, 0);

  return sha256(componentsString + extraDataString);
}
