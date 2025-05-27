import { FORM_INPUT_EVENTS } from "../constants";
import type { AttachedListenerInfo, CollectorSource } from "../types";

export class FormEventCollector implements CollectorSource {
  readonly key = "formInput";

  attachListeners(
    mainTargetElement: HTMLElement,
    _globalTargets: { window?: Window; document?: Document },
    centralEventHandler: (e: Event) => void
  ): AttachedListenerInfo[] {
    const attached: AttachedListenerInfo[] = [];

    FORM_INPUT_EVENTS.forEach((eventType) => {
      // These events typically target the form or its elements
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
