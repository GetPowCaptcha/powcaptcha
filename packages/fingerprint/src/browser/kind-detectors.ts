import countThruly from '../utils/count-truthy';

import BrowserKind from './types/browser-kind';

type BrowserKindDetectorItem = BrowserKind[] | Record<string, boolean>;
let cache: undefined | Record<string, BrowserKindDetectorItem> = undefined;

export const kindDetectors = () => {
  if (cache) return cache;

  cache = {
    // Chrome-specific features
    [BrowserKind.Chromium]: {
      chrome: 'chrome' in window || 'userAgentData' in navigator,
      clientHints: 'userAgentData' in navigator,
      scheduling: 'scheduling' in navigator,
      largestContentfulPaint: 'LargestContentfulPaint' in window,
      batteryManager: 'BatteryManager' in window,
      fileSystemAccess: 'showOpenFilePicker' in window,
    },
    // Firefox-specific features
    [BrowserKind.Gecko]: {
      buildID: 'buildID' in navigator,
      mozOrientation: 'mozOrientation' in screen,
      mozAppearance: 'MozAppearance' in (document.documentElement.style ?? {}),
      mozInnerScreenY: 'mozInnerScreenY' in window,
      mozFullScreen: 'mozFullScreen' in document,
    },
    // Safari-specific features
    [BrowserKind.WebKit]: {
      standalone: 'standalone' in navigator,
      safari: 'safari' in window,
      aplePayError: 'ApplePayError' in window,
      applePaySession: 'ApplePaySession' in window,
      applePaySetupFeature: 'ApplePaySetupFeature' in window,
    },
    // Edge-specific features
    [BrowserKind.Edge]: {
      documentMode: 'documentMode' in document,
      msLaunchUri: 'msLaunchUri' in navigator,
      msManipulationViewsEnabled: 'msManipulationViewsEnabled' in navigator,
      msSaveBlob: 'msSaveBlob' in navigator,
      msSaveOrOpenBlob: 'msSaveOrOpenBlob' in navigator,
    },
    // Opera-specific features
    [BrowserKind.Opera]: {
      opr: 'opr' in window,
      addons: 'addons' in window,
      browserSidebarPrivate: 'browserSidebarPrivate' in window,
      browserSettings: 'browserSettings' in window,
      browser: 'browser' in window,
    },
  };

  return cache;
};

let browsserKind: BrowserKind = BrowserKind.Unknown;
let browserFeatureCount: Record<string, number> | undefined = undefined;

export function getBrowserFeatureCounts(): Record<string, number> {
  browserFeatureCount = {};
  browsserKind = BrowserKind.Unknown;
  let maxValue = 0;
  for (const [key, value] of Object.entries(kindDetectors())) {
    browserFeatureCount[key] = countThruly(Object.values(value) as boolean[]);
    if (browserFeatureCount[key] > maxValue) {
      browsserKind = Number(key);
      maxValue = browserFeatureCount[key];
    }
  }
  return browserFeatureCount;
}

export function isKind(kind: BrowserKind): boolean {
  if (browserFeatureCount === undefined) {
    getBrowserFeatureCounts();
  }
  return browsserKind === kind;
}

export default function () {
  getBrowserFeatureCounts();
  return {
    browserFeatureCount,
    browsserKind,
  };
}
