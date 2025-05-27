import { ApplePaySource } from './apple-pay';
import { AudioSource } from './audio';
import { BrowserSource } from './browser';
import { CanvasSource } from './canvas';
import { FontSource } from './fonts';
import { LanguageSource } from './language';
import { MathBehaviorSource } from './math-behavior';
import { PluginsSource } from './plugins';
import { PrefersReducedMotionSource } from './prefers-reduced-motion';
import { ScreenSource } from './screen';
import { TimezoneInfoSource } from './timezone-info';
import { WebDriverSource } from './webdriver';
import { WebGLSource } from './webgl';

export const sources = [
  new ApplePaySource(),
  new CanvasSource(),
  new AudioSource(),
  new BrowserSource(),
  new LanguageSource(),
  new FontSource(),
  new PrefersReducedMotionSource(),
  new PluginsSource(),
  new MathBehaviorSource(),
  new TimezoneInfoSource(),
  new ScreenSource(),
  new WebDriverSource(),
  new WebGLSource(),
];
