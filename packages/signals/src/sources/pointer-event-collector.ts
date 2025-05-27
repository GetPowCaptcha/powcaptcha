import { POINTER_EVENTS } from "../constants";
import type { AttachedListenerInfo, CollectorSource } from "../types";

export class PointerEventCollector implements CollectorSource {
  readonly key = "pointer";

  attachListeners(
    mainTargetElement: HTMLElement,
    _globalTargets: { window?: Window; document?: Document },
    centralEventHandler: (e: Event) => void
  ): AttachedListenerInfo[] {
    const attached: AttachedListenerInfo[] = [];

    POINTER_EVENTS.forEach((eventType) => {
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
