import { sha256 } from 'js-sha256';

/**
 * Polyfills the `crypto.subtle.digest` method for environments where it is unavailable,
 * such as non-secure contexts (e.g., HTTP). This implementation specifically supports
 * the SHA-256 algorithm, as it is the only one required for browser usage in this context.
 *
 * The polyfill uses the `js-sha256` library to compute the hash and provides a fallback
 * for environments lacking native support for `crypto.subtle.digest`.
 *
 * If the `crypto.subtle` object is already available, this function does nothing.
 *
 *
 * @returns {void}
 */
export const polifyll = () => {
  if (!crypto?.subtle?.digest) {
    const subtlePolyfill = {
      digest: (algorithm: { name: string }, data: ArrayBuffer) => {
        if (algorithm.name === 'SHA-256') {
          try {
            const hash = sha256.create();
            hash.update(new Uint8Array(data));
            return hash.arrayBuffer();
          } catch (error) {
            console.error('SHA-256 polyfill error:', error);
          }
        }
        throw new Error('Unsupported algorithm : ' + algorithm.name);
      },
    };

    // Use the polyfill if crypto.subtle is not available
    Object.defineProperty(crypto, 'subtle', {
      value: subtlePolyfill,
      configurable: true,
    });
  }
};
