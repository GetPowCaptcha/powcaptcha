import { polifyll } from './polifyll';

export const detectNonSecureContextCryptoPolyfill = () => {
  if (!crypto?.subtle?.digest) {
    try {
      polifyll();
    } catch (error) {
      console.error('Failed to load polyfill for crypto.digest.]', error);
    }
  }
};
