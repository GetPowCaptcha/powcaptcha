import BrowserKind from './types/browser-kind';
import BrowserPrivacyProtectionKind from './types/browser-privacy-protection-kind';

import { isSourcePrivacyProtected } from './browse-privacy-protection-detectors';
import capabilities from './capabilities';
import kindDetectors, { isKind } from './kind-detectors';

interface BrowserInfo {
  os: string;
  mobile: boolean;
  tablet: boolean;
  engine: string;
  engineVersion: string;
}

class Browser {
  static getInfo(): Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  > {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const vendor = navigator.vendor;

    const browserInfo: BrowserInfo = {
      os: this.detectOS(ua, platform),
      mobile: this.isMobile(ua),
      tablet: this.isTablet(ua),
      engine: this.detectEngine(ua),
      engineVersion: this.detectEngineVersion(ua),
    };

    /**
     * While the userAgent can be spoofed, the idea is to compare it
     * on the server with the request headers and browser capabilities
     * to determine if the userAgent has been spoofed.
     */
    return {
      ...browserInfo,
      userAgent: ua,
      capabilities: capabilities(),
      kindDetectors: kindDetectors(),
      platform,
      vendor,
      doNotTrack: navigator.doNotTrack,
      maxTouchPoints: navigator.maxTouchPoints,
      webdriver: navigator.webdriver,
    };
  }

  public static isSourcePrivacyProtected(kind: BrowserPrivacyProtectionKind): boolean {
    return isSourcePrivacyProtected(kind);
  }

  public static isKind(kind: BrowserKind): boolean {
    return isKind(kind);
  }

  static detectOS(ua: string, platform: string): string {
    if (ua.includes('Windows NT')) {
      if (ua.includes('Windows NT 10')) return 'Windows 10';
      if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
      if (ua.includes('Windows NT 6.2')) return 'Windows 8';
      if (ua.includes('Windows NT 6.1')) return 'Windows 7';
      if (ua.includes('Windows NT 6.0')) return 'Windows Vista';
      if (ua.includes('Windows NT 5.1')) return 'Windows XP';
      return 'Windows';
    }
    if (ua.includes('Mac OS X')) {
      return 'macOS';
    }
    if (ua.includes('Android')) {
      return 'Android';
    }
    if (ua.includes('Linux') || platform.includes('X11')) {
      return 'Linux';
    }
    if (/iPhone|iPad|iPod/.test(ua)) {
      return 'iOS';
    }
    return 'unknown';
  }

  static isMobile(ua: string): boolean {
    return /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }

  static isTablet(ua: string): boolean {
    return /Tablet|iPad|PlayBook|Nexus 7|Nexus 10|Kindle Fire|Silk|Galaxy Tab/i.test(ua);
  }

  static detectEngine(ua: string): string {
    if (ua.includes('Gecko/')) {
      return 'Gecko';
    }
    if (ua.includes('AppleWebKit') && !/Edge\/|Edg\//.test(ua)) {
      return 'WebKit';
    }
    if (ua.includes('Trident/') || ua.includes('MSIE')) {
      return 'Trident';
    }
    if (/Edge\/|Edg\//.test(ua)) {
      return 'EdgeHTML';
    }
    if (ua.includes('Presto')) {
      return 'Presto';
    }
    return 'unknown';
  }

  static detectEngineVersion(ua: string): string {
    const geckoMatch = /Gecko\/([\d.]+)/.exec(ua);
    if (geckoMatch) return geckoMatch[1];

    const webKitMatch = /AppleWebKit\/([\d.]+)/.exec(ua);
    if (webKitMatch) return webKitMatch[1];

    const tridentMatch = /Trident\/([\d.]+)/.exec(ua);
    if (tridentMatch) return tridentMatch[1];

    const edgeHTMLMatch = /Edge\/([\d.]+)/.exec(ua) ?? /Edg\/([\d.]+)/.exec(ua);
    if (edgeHTMLMatch) return edgeHTMLMatch[1];

    const prestoMatch = /Presto\/([\d.]+)/.exec(ua);
    if (prestoMatch) return prestoMatch[1];

    return 'unknown';
  }
}

export default Browser;
