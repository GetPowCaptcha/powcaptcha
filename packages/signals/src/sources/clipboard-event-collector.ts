import { CLIPBOARD_EVENTS } from "../constants";
import type { AttachedListenerInfo, CollectorSource } from "../types";

export class ClipboardEventCollector implements CollectorSource {
  readonly key = "clipboard";

  attachListeners(
    mainTargetElement: HTMLElement,
    _globalTargets: { window?: Window; document?: Document },
    centralEventHandler: (e: Event) => void
  ): AttachedListenerInfo[] {
    const attached: AttachedListenerInfo[] = [];
    CLIPBOARD_EVENTS.forEach((eventType) => {
      // Listen on the main target element for clipboard events within it
      const target = mainTargetElement;
      if (!target) return;

      target.addEventListener(eventType, centralEventHandler, true);
      attached.push({
        target,
        type: eventType,
        handler: centralEventHandler,
        capture: true,
      });
    });

    return attached;
  }
}
