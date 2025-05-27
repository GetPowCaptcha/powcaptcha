import type { FingerprintOptions as Options } from "./options";

export const DEFAULT_OPTIONS: Required<Options> = {
  excludeSources: [],
  sourceTimeout: 500,
  debug: false,
};
