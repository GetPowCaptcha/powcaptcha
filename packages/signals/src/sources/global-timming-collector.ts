import { EVENT_CUSTOM_TARGETS, WINDOW_LEVEL_EVENTS } from "../constants";
import type { AttachedListenerInfo, CollectorSource } from "../types";

export class GlobalTimingCollector implements CollectorSource {
  readonly key = "globalTiming";

  attachListeners(
    _mainTargetElement: HTMLElement,
    globalTargets: { window?: Window; document?: Document },
    centralEventHandler: (e: Event) => void
  ): AttachedListenerInfo[] {
    const attached: AttachedListenerInfo[] = [];

    WINDOW_LEVEL_EVENTS.forEach((eventType) => {
      const targetKey = EVENT_CUSTOM_TARGETS[eventType];
      let target: EventTarget | undefined;

      if (targetKey === "window") {
        target = globalTargets.window;
      } else if (targetKey === "document") {
        target = globalTargets.document;
      }

      if (!target) {
        console.warn(
          `SignalsCollector: Could not find global target '${targetKey}' for event type "${eventType}". Skipping.`
        );
        return;
      }

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
