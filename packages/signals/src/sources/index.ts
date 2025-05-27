import type { CollectorSource } from "../types";

export { ClipboardEventCollector } from "./clipboard-event-collector";
export { FormEventCollector } from "./form-event-collector";
export { KeyboardEventCollector } from "./keyboard-event-collector";
export { PointerEventCollector } from "./pointer-event-collector";
export { WindowEventCollector } from "./window-event-collector";

import { ClipboardEventCollector } from "./clipboard-event-collector";
import { FormEventCollector } from "./form-event-collector";
import { KeyboardEventCollector } from "./keyboard-event-collector";
import { PointerEventCollector } from "./pointer-event-collector";
import { WindowEventCollector } from "./window-event-collector";

export const defaultCollectorSources: CollectorSource[] = [
  new PointerEventCollector(),
  new KeyboardEventCollector(),
  new FormEventCollector(),
  new ClipboardEventCollector(),
  new WindowEventCollector(),
];
