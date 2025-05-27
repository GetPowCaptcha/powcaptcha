import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const KEY = 'screen';

/**
 * Collects information about the user's screen.
 */
export class ScreenSource implements Source {
  public readonly key = KEY;

  /**
   * Gathers screen properties like width, height, color depth, etc.
   * @returns An object containing screen information or an error object.
   */
  public collect(): FingerprintComponentValue {
    try {
      // Check if the screen object is available in the current environment
      if (typeof screen !== 'undefined') {
        return {
          availHeight: Number(screen.availHeight),
          availLeft: 'availLeft' in screen ? Number(screen.availLeft) : undefined,
          availTop: 'availTop' in screen ? Number(screen.availTop) : undefined,
          availWidth: Number(screen.availWidth),
          colorDepth: Number(screen.colorDepth),
          height: Number(screen.height),
          isExtended: 'isExtended' in screen ? Boolean(screen.isExtended) : undefined,
          orientation: {
            angle: screen.orientation?.angle ?? undefined,
            type: screen.orientation?.type ?? undefined,
          },
          pixelDepth: Number(screen.pixelDepth),
          width: Number(screen.width),
        };
      } else {
        return { error: 'screen_api_unavailable' };
      }
    } catch (error: unknown) {
      // Catch any unexpected errors during collection
      const errorMessage = error instanceof Error ? error.message : 'screen_info_unknown_error';
      return { error: `screen_info_collection_error: ${errorMessage}` };
    }
  }
}
