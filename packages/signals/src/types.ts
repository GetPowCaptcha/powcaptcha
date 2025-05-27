/**
 * Interface representing the bounding rectangle of a target element.
 * Provides the position and dimensions of the element relative to the viewport.
 */
export interface TargetBoundingRect {
  /** X-coordinate of the top-left corner of the rectangle */
  x: number;
  /** Y-coordinate of the top-left corner of the rectangle */
  y: number;
  /** Width of the rectangle */
  w: number;
  /** Height of the rectangle */
  h: number;
  /** Distance from the top edge of the viewport to the top edge of the rectangle */
  t: number;
  /** Distance from the right edge of the viewport to the right edge of the rectangle */
  r: number;
  /** Distance from the bottom edge of the viewport to the bottom edge of the rectangle */
  b: number;
  /** Distance from the left edge of the viewport to the left edge of the rectangle */
  l: number;
}
/**
 * Interface for individual signal data points collected.
 *
 */
interface DetailedSignalData {
  timestamp: number;
  targetId?: string;
  targetName?: string;
  targetTag?: string;
  targetType?: string;
  targetClasses?: string[];
  value?: string | number | boolean | string[];
  clientX?: number;
  clientY?: number;
  pointerType?: string;
  key?: string;
  code?: string;
  scrollX?: number;
  scrollY?: number;
  relatedTargetId?: string;
  visibilityState?: DocumentVisibilityState;
  windowInnerWidth?: number;
  windowInnerHeight?: number;
  targetBoundingRect?: TargetBoundingRect;
  clipboardAction?: 'c' | 'p' | 'x';
  deltaTime?: number;
  distance?: number;
  speed?: number;
  angle?: number;
}

// Short version of SignalData for more compact storage
export interface SignalData {
  ts: DetailedSignalData['timestamp'];
  /** Target element's ID */
  tid?: DetailedSignalData['targetId'];
  /** Target element's name attribute */
  tn?: DetailedSignalData['targetName'];
  /** Target element's tag name (e.g., 'div', 'input') */
  tg?: DetailedSignalData['targetTag'];
  /** Target element's type attribute (e.g., 'text', 'button') */
  tt?: DetailedSignalData['targetType'];
  /** Target element's class list */
  tc?: DetailedSignalData['targetClasses'];
  /** Value associated with the event (e.g., input value) */
  v?: DetailedSignalData['value'];
  /** X-coordinate of the event (e.g., mouse position) */
  x?: DetailedSignalData['clientX'];
  /** Y-coordinate of the event (e.g., mouse position) */
  y?: DetailedSignalData['clientY'];
  /** Pointer type (e.g., 'mouse', 'touch', 'pen') */
  pt?: DetailedSignalData['pointerType'];
  /** Key pressed (for keyboard events) */
  k?: DetailedSignalData['key'];
  /** Code of the key pressed (for keyboard events) */
  c?: DetailedSignalData['code'];
  /** Scroll position on the X-axis */
  sx?: DetailedSignalData['scrollX'];
  /** Scroll position on the Y-axis */
  sy?: DetailedSignalData['scrollY'];
  /** Related target's ID (e.g., for focus/blur events) */
  rt?: DetailedSignalData['relatedTargetId'];
  /** Document visibility state (e.g., 'visible', 'hidden') */
  vs?: DetailedSignalData['visibilityState'];
  /** Viewport width at the time of the event */
  vw?: DetailedSignalData['windowInnerWidth'];
  /** Viewport height at the time of the event */
  vh?: DetailedSignalData['windowInnerHeight'];
  /** Target bounding rectangle (shortened properties) */
  tr?: TargetBoundingRect;
  /** Clipboard action: 'c' (copy), 'p' (paste), 'x' (cut) */
  ca?: DetailedSignalData['clipboardAction'];
  /** Time delta since the last event of the same type */
  dt?: DetailedSignalData['deltaTime'];
  /** Distance moved since the last move event */
  d?: DetailedSignalData['distance'];
  /** Speed of movement (pixels per second) */
  s?: DetailedSignalData['speed'];
  /** Angle of movement (in radians) */
  a?: DetailedSignalData['angle'];
}

/**
 * Structure holding all collected signals, grouped by event type, in a more compact format.
 *  * The keys are event types (e.g., 'click', 'keydown'), and the values are arrays of SignalData.
 */
export type CollectedSignalData = Record<string /** Event Type */, SignalData[]>;

/**
 * Callback function type executed when signal collection finishes.
 */
export type OnCollectedCallback = (collectedSignals: CollectedSignalData) => void;

/**
 * Information about an attached event listener. Used for later removal.
 */
export interface AttachedListenerInfo {
  target: EventTarget;
  type: string;
  handler: (e: Event) => void;
  capture: boolean;
}

/**
 * Interface for a module responsible for attaching listeners for a specific group of events.
 */
export interface CollectorSource {
  /** A unique key identifying the group of events (e.g., 'pointer', 'keyboard'). */
  readonly key: string;

  /**
   * Attaches the necessary event listeners for this source.
   * @param mainTargetElement The primary element being observed (e.g., the form).
   * @param globalTargets References to window and document for global events.
   * @param centralEventHandler The main handler function in SignalsCollector to call when an event occurs.
   * @returns An array of objects detailing the listeners that were attached.
   */
  attachListeners(
    mainTargetElement: HTMLElement,
    globalTargets: { window?: Window; document?: Document },
    centralEventHandler: (e: Event) => void
  ): AttachedListenerInfo[];
}
