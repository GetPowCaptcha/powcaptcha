import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';
import { withIframe } from '../utils/iframe';

const FONT_KEY = 'fonts';
const FONTS_TO_TEST = [
  'Arial',
  'Verdana',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Tahoma',
  'Calibri',
  'Segoe UI',
  'Consolas',
  'Cambria',
  'San Francisco',
  'SF Pro Text',
  'SF Pro Display',
  'Helvetica Neue',
  'Menlo',
  'Geneva',
  'DejaVu Sans',
  'Ubuntu',
  'Cantarell',
  'Noto Sans',
  'Comic Sans MS',
  'Monospace',
  'Serif',
  'Sans-serif',
];
const TEST_STRING =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_+=[]{};:\'",.<>/?`~ WwmMiIl';
const EMOJI_STRING = '😂👍🎉🤔';

export class FontSource implements Source {
  public readonly key = FONT_KEY;

  public async collect(): Promise<FingerprintComponentValue> {
    const result = await withIframe<Record<string, FingerprintComponentValue> | { error: string }>(
      (_iframeWindow, iframeDoc) => {
        const availableFonts: Record<string, { base: string; emoji: string }> = {};
        const baseFont = 'monospace';
        const iframeBody = iframeDoc.body;
        const container = iframeDoc.createElement('div');
        container.style.fontSize = '72px';
        const baseSpan = iframeDoc.createElement('span');
        baseSpan.style.fontFamily = baseFont;
        baseSpan.textContent = TEST_STRING;
        container.appendChild(baseSpan);
        const baseEmojiSpan = iframeDoc.createElement('span');
        baseEmojiSpan.style.fontFamily = baseFont;
        baseEmojiSpan.textContent = EMOJI_STRING;
        container.appendChild(baseEmojiSpan);
        const testSpan = iframeDoc.createElement('span');
        testSpan.textContent = TEST_STRING;
        container.appendChild(testSpan);
        const testEmojiSpan = iframeDoc.createElement('span');
        testEmojiSpan.textContent = EMOJI_STRING;
        container.appendChild(testEmojiSpan);
        iframeBody.appendChild(container);

        const baseDimensions = `${baseSpan.offsetWidth}x${baseSpan.offsetHeight}`;
        const baseEmojiDimensions = `${baseEmojiSpan.offsetWidth}x${baseEmojiSpan.offsetHeight}`;

        for (const font of FONTS_TO_TEST) {
          try {
            testSpan.style.fontFamily = `'${font}', ${baseFont}`;
            testEmojiSpan.style.fontFamily = `'${font}', ${baseFont}`;
            const testDimensions = `${testSpan.offsetWidth}x${testSpan.offsetHeight}`;
            const testEmojiDimensions = `${testEmojiSpan.offsetWidth}x${testEmojiSpan.offsetHeight}`;
            if (testDimensions !== baseDimensions || testEmojiDimensions !== baseEmojiDimensions) {
              availableFonts[font] = {
                base: testDimensions,
                emoji: testEmojiDimensions,
              };
            }
          } catch (e) {
            console.warn(`Error applying/measuring font '${font}':`, e);
          }
        }

        const sortedFonts = Object.keys(availableFonts).sort();
        const finalResult: Record<string, FingerprintComponentValue> = {};
        sortedFonts.forEach((font) => {
          finalResult[font] = availableFonts[font];
        });
        return finalResult;
      },
      { timeoutMs: 500 }
    );
    return result;
  }
}
