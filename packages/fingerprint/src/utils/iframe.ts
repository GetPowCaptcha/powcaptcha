interface WithIframeOptions {
  /**
   * Maximum time in milliseconds to wait for the iframe to load
   * and the callback to complete. 0 to disable.
   * @default 1000
   */
  timeoutMs?: number;
  /**
   * 'sandbox' attribute to apply to the iframe.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
   * @default undefined (no sandbox)
   */
  sandbox?: string;
}

/**
 * Executes a callback function inside a hidden and isolated iframe.
 * Handles creating, loading, executing the callback, and cleaning up the iframe.
 *
 * @template T The type of value expected to be returned by the callback.
 * @param callback The function to execute inside the iframe. Receives `window` and `document` of the iframe. Can be synchronous or asynchronous.
 * @param options Configuration options such as timeout or sandbox.
 * @returns A promise that resolves with the value returned by the callback, or with an error object if something fails.
 */
export function withIframe<T>(
  callback: (iframeWindow: Window, iframeDocument: Document) => T | Promise<T>,
  options: WithIframeOptions = {}
): Promise<T | { error: string }> {
  // Default timeout of 1 second
  const { timeoutMs = 1000, sandbox } = options;

  return new Promise((resolve) => {
    let iframe: HTMLIFrameElement | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (iframe?.parentNode) {
        try {
          iframe.parentNode.removeChild(iframe);
        } catch (e) {
          console.warn('Minor error during iframe cleanup:', e);
        }
      }
      iframe = null;
    };

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        console.warn(`withIframe timed out after ${timeoutMs}ms`);
        resolve({ error: `timeout_${timeoutMs}ms` });
        cleanup();
      }, timeoutMs);
    }

    try {
      iframe = document.createElement('iframe');

      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.visibility = 'hidden';
      iframe.width = '1';
      iframe.height = '1';

      if (sandbox !== undefined) {
        iframe.sandbox.value = sandbox;
      }

      iframe.onload = async () => {
        let iframeWindow: Window | null = null;
        let iframeDocument: Document | null = null;
        try {
          iframeWindow = iframe?.contentWindow ?? null;
          iframeDocument = iframeWindow?.document ?? null;

          if (!iframeWindow || !iframeDocument) {
            throw new Error("Could not access the iframe's context (window/document).");
          }

          const result = await Promise.resolve(callback(iframeWindow, iframeDocument));
          resolve(result);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown';
          resolve({
            error: `callback_error: ${errorMessage}`,
          });
        } finally {
          cleanup();
        }
      };

      iframe.onerror = (event: Event | string) => {
        console.error('Error loading the iframe in withIframe:', event);
        resolve({ error: 'iframe_load_error' });
        cleanup();
      };

      document.body.appendChild(iframe);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      resolve({
        error: `iframe_creation_error: ${errorMessage}`,
      });
      cleanup();
    }
  });
}
