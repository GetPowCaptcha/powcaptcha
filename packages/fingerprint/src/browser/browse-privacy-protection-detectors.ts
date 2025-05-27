import countThruly from "../utils/count-truthy";

import BrowserKind from "./types/browser-kind";
import BrowserPrivacyProtectionKind from "./types/browser-privacy-protection-kind";

import { isKind } from "./kind-detectors";

let cache: undefined | Record<string, boolean[]> = undefined;

const sourceProtectionDetectors = () => {
  if (cache) return cache;
  const IS_BRAVE =
    isKind(BrowserKind.Chromium) &&
    "brave" in (navigator as unknown as { brave: object });

  // if one of these is true, we can assume the browser is blocking fingerprinting
  const sourceProtectionDetectors = {
    [BrowserPrivacyProtectionKind.Plugins]: [
      // Brave fakes plugins
      IS_BRAVE,
    ],
    [BrowserPrivacyProtectionKind.Canvas]: [
      // Brave fakes canvas
      IS_BRAVE,
      isKind(BrowserKind.Gecko),
    ],
    [BrowserPrivacyProtectionKind.Language]: [
      // Chromium fakes language
      isKind(BrowserKind.Chromium),
    ],
    [BrowserPrivacyProtectionKind.HardwareConcurrency]: [
      // Brave fakes hardware concurrency
      IS_BRAVE,
    ],
  };

  cache = sourceProtectionDetectors;

  return sourceProtectionDetectors;
};

export function isSourcePrivacyProtected(
  kind: BrowserPrivacyProtectionKind
): boolean {
  return countThruly(sourceProtectionDetectors()[kind]) > 0;
}

export default sourceProtectionDetectors;
