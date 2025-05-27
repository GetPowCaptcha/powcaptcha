import { sha256 } from '@powcaptcha/crypto';

import Browser from '../browser/browser';
import BrowserPrivacyProtectionKind from '../browser/types/browser-privacy-protection-kind';
import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const CANVAS_KEY = 'canvas';

export class CanvasSource implements Source {
  public readonly key = CANVAS_KEY;

  public async collect(): Promise<FingerprintComponentValue> {
    if (Browser.isSourcePrivacyProtected(BrowserPrivacyProtectionKind.Canvas)) {
      return undefined;
    }
    const collectedData: Record<string, FingerprintComponentValue> = {};
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    try {
      canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 60;
      ctx = canvas.getContext('2d');

      if (!ctx) {
        return { error: 'no_canvas_context' };
      }

      const text = 'BrowserFP l1b Я G ε 한글 🎉';
      ctx.font = '18px "Arial"';
      ctx.fillStyle = 'rgb(100, 150, 200)';
      ctx.fillText(text, 10, 20);
      ctx.font = '16px "Times New Roman"';
      ctx.fillStyle = 'rgba(50, 200, 50, 0.7)';
      ctx.fillText(text, 15, 45);
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.fillRect(80, 5, 30, 30);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(0,255,255)';
      ctx.beginPath();
      ctx.arc(100, 20, 20, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.beginPath();
      ctx.rect(150, 10, 50, 30);
      collectedData.isPointInPath = ctx.isPointInPath(160, 20);
      collectedData.isPointNotInPath = ctx.isPointInPath(210, 20);

      const metrics = ctx.measureText(text);
      collectedData.textMetricsWidth = metrics.width;

      const dataUrl = canvas.toDataURL();
      collectedData.dataUrlHash = await sha256(dataUrl);

      return collectedData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'canvas_unknown_error';
      return { error: errorMessage };
    } finally {
      if (canvas?.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }
}
