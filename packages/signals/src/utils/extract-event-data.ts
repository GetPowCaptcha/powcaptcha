import type { SignalData } from '../types';

/**
 * Extracts relevant and structured data from a DOM Event object.
 * This function is designed to be pure and reusable.
 *
 * @param e The DOM Event object.
 * @param timestamp The high-resolution timestamp (performance.now()) when the event was handled.
 * @returns A SignalData object containing extracted information.
 */
export function extractEventData(e: Event, timestamp: number): SignalData {
  const target = e.target as HTMLElement | Document | Window; // Target can be element, document, or window
  let targetElement: HTMLElement | null = null;

  // Identify the HTMLElement if possible
  if (target instanceof HTMLElement) {
    targetElement = target;
  } else if (target instanceof Document && (e.type === 'scroll' || e.type === 'visibilitychange')) {
    // Events targeting document
  } else if (target instanceof Window && e.type === 'scroll') {
    // Events targeting window
  }

  const domRectToShortTargetBoundingRect = (
    rect: DOMRect
  ):
    | {
        x: number;
        y: number;
        w: number;
        h: number;
        t: number;
        r: number;
        b: number;
        l: number;
      }
    | undefined => {
    return {
      x: rect?.x,
      y: rect?.y,
      w: rect?.width,
      h: rect?.height,
      t: rect?.top,
      r: rect?.right,
      b: rect?.bottom,
      l: rect?.left,
    };
  };

  const signal: SignalData = {
    ts: timestamp,
    tid: targetElement?.id ?? undefined,
    tn: (targetElement as HTMLInputElement)?.name,
    tg: targetElement?.tagName,
    tt: (targetElement as HTMLInputElement)?.type,
    tc:
      targetElement?.classList && targetElement.classList.length > 0
        ? Array.from(targetElement.classList)
        : undefined,
  };

  if (e.type === 'visibilitychange' && typeof document !== 'undefined') {
    signal.vs = document.visibilityState;
  } else if (
    (e.type === 'input' || e.type === 'change') &&
    targetElement instanceof HTMLInputElement
  ) {
    signal.v =
      targetElement.type === 'checkbox' || targetElement.type === 'radio'
        ? targetElement.checked
        : targetElement.value;
  } else if (
    (e.type === 'input' || e.type === 'change') &&
    targetElement instanceof HTMLSelectElement
  ) {
    signal.v = Array.from(targetElement.selectedOptions).map((o) => o.value);
  } else if (
    (e.type === 'input' || e.type === 'change') &&
    targetElement instanceof HTMLTextAreaElement
  ) {
    signal.v = targetElement.value;
  } else if (e instanceof MouseEvent) {
    signal.x = e.clientX;
    signal.y = e.clientY;
    if (
      targetElement &&
      (e.type === 'click' || e.type === 'focus' || e.type === 'pointerdown') &&
      typeof window !== 'undefined'
    ) {
      signal.vw = window.innerWidth;
      signal.vh = window.innerHeight;
      const boundingClientRect = targetElement.getBoundingClientRect
        ? targetElement.getBoundingClientRect()
        : undefined;
      signal.tr = boundingClientRect
        ? domRectToShortTargetBoundingRect(boundingClientRect)
        : undefined;
    }
  }
  if (e instanceof PointerEvent) {
    signal.pt = e.pointerType;
  } else if (e instanceof KeyboardEvent) {
    signal.k = e.key;
    signal.c = e.code;
  } else if (e instanceof FocusEvent) {
    signal.rt = (e.relatedTarget as HTMLElement)?.id || undefined;
    if (targetElement && typeof window !== 'undefined') {
      signal.vw = window.innerWidth;
      signal.vh = window.innerHeight;
      const clientRect = targetElement.getBoundingClientRect
        ? targetElement.getBoundingClientRect()
        : undefined;
      signal.tr = clientRect ? domRectToShortTargetBoundingRect(clientRect) : undefined;
    }
  } else if (e.type === 'scroll' && typeof window !== 'undefined') {
    if (target === document || target === window) {
      signal.sx = window.scrollX;
      signal.sy = window.scrollY;
    } else if (targetElement instanceof HTMLElement) {
      signal.sx = targetElement.scrollLeft;
      signal.sy = targetElement.scrollTop;
    }
  } else if (e instanceof ClipboardEvent) {
    if (e.type === 'copy') {
      signal.ca = 'c';
    } else if (e.type === 'paste') {
      signal.ca = 'p';
    } else if (e.type === 'cut') {
      signal.ca = 'x';
    }
  }

  return signal;
}
