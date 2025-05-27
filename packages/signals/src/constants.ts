// Event Groups
export const POINTER_EVENTS: string[] = [
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',
  'click',
  'dblclick',
];

export const KEYBOARD_EVENTS: string[] = ['keydown', 'keyup'];

export const FORM_INPUT_EVENTS: string[] = ['input', 'change', 'submit', 'focus', 'blur'];

export const CLIPBOARD_EVENTS: string[] = ['copy', 'paste', 'cut'];

export const WINDOW_LEVEL_EVENTS: string[] = ['scroll', 'visibilitychange'];

export const DEFAULT_EVENTS_TO_LISTEN: string[] = [
  ...POINTER_EVENTS,
  ...KEYBOARD_EVENTS,
  ...FORM_INPUT_EVENTS,
  ...CLIPBOARD_EVENTS,
  ...WINDOW_LEVEL_EVENTS,
];

/**
 * Specifies custom event targets for certain event types.
 * If an event type is not listed here, it defaults to the main target element (e.g., the form).
 */
export const EVENT_CUSTOM_TARGETS: Record<string, 'window' | 'document'> = {
  scroll: 'window',
  visibilitychange: 'document',
  resize: 'window',
  blur: 'window',
  focus: 'window',
};

export const DEFAULT_MAX_COLLECT_TIME_MS = 0; // 0 means no time limit, we'll use DEFAULT_MAX_COLLECT_EVENTS to limit the number of events
export const DEFAULT_MAX_COLLECT_EVENTS = 100;
export const MOVE_THROTTLE_MS = 50;
