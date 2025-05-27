import { DEFAULT_OPTIONS } from './config/default';
import type { FingerprintOptions } from './config/options';
import type {
  FingerprintComponents,
  FingerprintComponentValue,
  FingerprintResult,
} from './types/fingerprint';

export * from './sources';

import { generateHash } from './processing/hasher';
import { promiseWithTimeout } from './utils/helpers';

import { sources as availableSources } from './sources';

export { generateHash } from './processing/hasher';

/**
 * Generates a fingerprint by collecting data from various sources and combining it into a unique identifier.
 *
 * @param userOptions - Optional configuration for fingerprint generation.
 *   - `excludeSources`: An array of source keys to exclude from the fingerprint generation.
 *   - `sourceTimeout`: The maximum time (in milliseconds) to wait for each source to collect data.
 *   - `debug`: A boolean flag to enable or disable debug logging.
 *
 * @returns A promise that resolves to an object containing:
 *   - `fingerprintId`: A unique identifier generated from the collected components.
 *   - `components`: An object mapping source keys to their collected data or error information.
 *   - `duration`: The total time (in milliseconds) taken to generate the fingerprint.
 *
 * @throws Will log errors if any source fails or if the fingerprint ID generation encounters an issue.
 *
 * @example
 * ```typescript
 * const result = await generateFingerprint({
 *   excludeSources: ['audio', 'canvas'],
 *   sourceTimeout: 5000,
 *   debug: true,
 * });
 * console.log(result.fingerprintId);
 * console.log(result.components);
 * console.log(result.duration);
 * ```
 */
export async function generateFingerprint(
  userOptions?: FingerprintOptions
): Promise<FingerprintResult | FingerprintComponents> {
  const startTime = performance.now();
  const options: Required<FingerprintOptions> = {
    excludeSources: [
      ...(DEFAULT_OPTIONS.excludeSources || []),
      ...(userOptions?.excludeSources ?? []),
    ],
    sourceTimeout: userOptions?.sourceTimeout ?? DEFAULT_OPTIONS.sourceTimeout,
    debug: userOptions?.debug ?? DEFAULT_OPTIONS.debug,
  };

  //TODO: replace options.debug logic with a the logger
  if (options.debug)
    console.log('[Fingerprint] Starting generation with options:', JSON.stringify(options));

  const sourcesToRun = availableSources.filter(
    (source) => !options.excludeSources.includes(source.key)
  );
  if (options.debug)
    console.log(`[Fingerprint] Running sources: ${sourcesToRun.map((s) => s.key).join(', ')}`);

  const settledResults = await Promise.allSettled(
    sourcesToRun.map((source) => {
      const sourcePromise = Promise.resolve()
        .then(() => source.collect())
        .catch((error) => {
          console.error(`[Fingerprint] Uncaught error in source '${source.key}':`, error);
          return {
            error: `uncaught_error: ${error instanceof Error ? error.message : String(error)}`,
          };
        });
      return options.sourceTimeout > 0
        ? promiseWithTimeout(sourcePromise, options.sourceTimeout, {
            error: `timeout_${options.sourceTimeout}ms`,
          })
        : sourcePromise;
    })
  );

  const components: FingerprintComponents = {};
  settledResults.forEach((result, index) => {
    const sourceKey = sourcesToRun[index].key;
    if (result.status === 'fulfilled' && result.value !== undefined) {
      components[sourceKey] = result.value;
      if (options.debug) {
        const isError =
          typeof result.value === 'object' && result.value !== null && 'error' in result.value;
        if (isError) {
          console.warn(
            `[Fingerprint] Source '${sourceKey}' reported error:`,
            (result.value as { error: string }).error
          );
        } else {
          const logValue =
            JSON.stringify(result.value)?.length > 200
              ? JSON.stringify(result.value).substring(0, 197) + '...'
              : result.value;
          console.log(`[Fingerprint] Source '${sourceKey}' success:`, logValue);
        }
      }
    } else if (result.status === 'rejected') {
      console.error(
        `[Fingerprint] Source '${sourceKey}' promise rejected unexpectedly:`,
        result.reason
      );
      components[sourceKey] = { error: `promise_rejected: ${result.reason}` };
    } else if (options.debug && result.status === 'fulfilled' && result.value === undefined) {
      console.log(`[Fingerprint] Source '${sourceKey}' returned undefined, excluding.`);
    }
  });
  let fingerprintId = '';
  try {
    fingerprintId = await generateHash(components);
  } catch (error) {
    if (window && !window.isSecureContext) {
      console.error('[Fingerprint] Error generating fingerprint ID: Insecure context.', error);
    } else {
      console.error(`[Fingerprint] Error generating fingerprint ID:`, error);
    }
  }

  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  return { fingerprintId, components, duration };
}

// Exportar la función principal y tipos útiles
export type {
  FingerprintComponents,
  FingerprintComponentValue,
  FingerprintOptions,
  FingerprintResult,
};
