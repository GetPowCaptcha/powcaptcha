import type { FingerprintComponents } from '@powcaptcha/fingerprint';

import type {
  CalculatedFeatures,
  CollectedSignalData,
  FingerprintComponentsFeatures,
  SignalData,
} from './types';

/**
 * @class SignalFeatureAnalyzer
 * @description Analyzes collected signal data to extract various features.
 * You can use this class in your application to analyze user interactions and generate features for further processing.
 */
export class SignalsFeatureAnalyzer {
  private static calculateStats(data: number[]): { mean: number; stddev: number } {
    const n = data.length;
    if (n === 0) return { mean: 0, stddev: 0 };

    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n;
    const stddev = Math.sqrt(variance);

    return { mean: parseFloat(mean.toFixed(1)), stddev: parseFloat(stddev.toFixed(1)) };
  }

  private static calculateSessionDuration(collectedData: CollectedSignalData): number {
    const firstEvents = collectedData.gt || []; // 'gt' 'global timestamps'
    if (firstEvents.length < 2) {
      let minTs = Infinity;
      let maxTs = -Infinity;
      Object.values(collectedData).forEach((eventsArray) => {
        if (Array.isArray(eventsArray)) {
          eventsArray.forEach((event: SignalData) => {
            if (event.ts < minTs) minTs = event.ts;
            if (event.ts > maxTs) maxTs = event.ts;
          });
        }
      });
      if (minTs === Infinity || maxTs === -Infinity) return 0;
      return parseFloat(((maxTs - minTs) / 1000).toFixed(1));
    }
    const startTime = firstEvents[0]?.ts || 0;
    const endTime = firstEvents[firstEvents.length - 1]?.ts || startTime;
    return parseFloat(((endTime - startTime) / 1000).toFixed(1));
  }

  private static countTotalEvents(collectedData: CollectedSignalData): number {
    return Object.values(collectedData).reduce((sum, eventsArray) => {
      if (Array.isArray(eventsArray)) {
        return sum + eventsArray.length;
      }
      return sum;
    }, 0);
  }

  private static extractNumericValues(
    events: SignalData[] | undefined,
    field: keyof SignalData
  ): number[] {
    if (!events) return [];
    return events
      .map((event) => event[field] as number)
      .filter((val) => typeof val === 'number' && isFinite(val));
  }

  private static calculatePointerTypeMix(pointerEvents: SignalData[] | undefined): number {
    if (!pointerEvents || pointerEvents.length === 0) return -1;
    let touchCount = 0;
    let mouseCount = 0;
    pointerEvents.forEach((event) => {
      if (event.pt === 'touch') touchCount++;
      else if (event.pt === 'mouse') mouseCount++;
    });
    const total = touchCount + mouseCount;
    if (total === 0) return -1;
    return parseFloat((touchCount / total).toFixed(2));
  }

  private static countSpecificKeyPress(
    keyEvents: SignalData[] | undefined,
    keyToCount: string
  ): number {
    if (!keyEvents) return 0;
    return keyEvents.filter((event) => event.k === keyToCount || event.c === keyToCount).length;
  }

  private static countDistinctTargetNames(collectedData: CollectedSignalData): number {
    const targetNames = new Set<string>();
    const eventTypesToConsider: (keyof CollectedSignalData)[] = [
      'pointerdown',
      'click',
      'keydown',
      'input',
      'focus',
      'change',
    ];

    eventTypesToConsider.forEach((eventType) => {
      const events = collectedData[eventType];
      if (Array.isArray(events)) {
        events.forEach((event: SignalData) => {
          if (event.tn && typeof event.tn === 'string' && event.tn.trim() !== '') {
            targetNames.add(event.tn.trim());
          } else if (event.tg && event.tg.trim() !== '' && !event.tn) {
            // TODO ?
            // targetNames.add(`TAG:${event.tg.trim()}`);
          }
        });
      }
    });
    return targetNames.size;
  }

  private static calculateAverageFocusDuration(
    focusEvents: SignalData[] | undefined,
    blurEvents: SignalData[] | undefined
  ): number {
    if (!focusEvents || !blurEvents || focusEvents.length === 0 || blurEvents.length === 0)
      return 0;

    const focusMap: Record<string, number> = {};
    const durations: number[] = [];

    const allEvents = [...focusEvents, ...blurEvents].sort((a, b) => a.ts - b.ts);

    allEvents.forEach((event) => {
      const targetKey = event.tn ?? event.tid ?? (event.tg ? `TAG:${event.tg}` : `TS:${event.ts}`);
      if (!targetKey) return;

      const isFocusEvent = focusEvents.some(
        (fe) =>
          fe.ts === event.ts && (fe.tn === event.tn || fe.tid === event.tid || fe.tg === event.tg)
      );
      const isBlurEvent = blurEvents.some(
        (be) =>
          be.ts === event.ts && (be.tn === event.tn || be.tid === event.tid || be.tg === event.tg)
      );

      if (isFocusEvent) {
        focusMap[targetKey] = event.ts;
      } else if (isBlurEvent && focusMap[targetKey] !== undefined) {
        const duration = event.ts - focusMap[targetKey];
        if (duration > 0 && duration < 300000) {
          durations.push(duration);
        }
        delete focusMap[targetKey];
      }
    });

    if (durations.length === 0) return 0;
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    return parseFloat(avgDuration.toFixed(0));
  }

  private static findMaxScrollY(scrollEvents: SignalData[] | undefined): number {
    if (!scrollEvents) return 0;
    const scrollYValues = this.extractNumericValues(scrollEvents, 'sy');
    return scrollYValues.length > 0 ? Math.max(...scrollYValues) : 0;
  }

  private static calculateAverageViewport(
    events: SignalData[] | undefined,
    dimension: 'vw' | 'vh'
  ): number {
    if (!events || events.length === 0) return 0;
    const values = this.extractNumericValues(events, dimension);
    if (values.length === 0) return 0;
    const validValues = values.filter((v) => v > 0);
    if (validValues.length === 0) return 0;
    const sum = validValues.reduce((a, b) => a + b, 0);
    return parseFloat((sum / validValues.length).toFixed(0));
  }

  private static calculateTotalPointerDistance(
    pointerMoveEvents: SignalData[] | undefined
  ): number {
    let totalDistance = 0;
    if (pointerMoveEvents && pointerMoveEvents.length > 1) {
      for (let i = 1; i < pointerMoveEvents.length; i++) {
        const prev = pointerMoveEvents[i - 1];
        const curr = pointerMoveEvents[i];
        if (
          typeof prev.x === 'number' &&
          typeof prev.y === 'number' &&
          typeof curr.x === 'number' &&
          typeof curr.y === 'number'
        ) {
          totalDistance += Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        }
      }
    }
    return parseFloat(totalDistance.toFixed(1));
  }

  private static calculateAverageClickDuration(
    pointerDownEvents: SignalData[] | undefined,
    pointerUpEvents: SignalData[] | undefined
  ): { averageDuration: number; clickCount: number } {
    if (
      !pointerDownEvents ||
      !pointerUpEvents ||
      pointerDownEvents.length === 0 ||
      pointerUpEvents.length === 0
    ) {
      return { averageDuration: 0, clickCount: 0 };
    }

    const durations: number[] = [];
    const sortedDownEvents = [...pointerDownEvents].sort((a, b) => a.ts - b.ts);
    const sortedUpEvents = [...pointerUpEvents].sort((a, b) => a.ts - b.ts);

    let upIndex = 0;
    for (const downEvent of sortedDownEvents) {
      // Find the next pointerup event that occurs after the current pointerdown
      while (upIndex < sortedUpEvents.length && sortedUpEvents[upIndex].ts < downEvent.ts) {
        upIndex++;
      }
      if (upIndex < sortedUpEvents.length) {
        const upEvent = sortedUpEvents[upIndex];
        const duration = upEvent.ts - downEvent.ts;
        if (duration > 0 && duration < 5000) {
          // Consider reasonable click durations (e.g., < 5s)
          durations.push(duration);
        }
        upIndex++;
      }
    }

    if (durations.length === 0) return { averageDuration: 0, clickCount: 0 };
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    return {
      averageDuration: parseFloat(avgDuration.toFixed(0)),
      clickCount: durations.length,
    };
  }

  private static calculateAverageDwellTime(
    keyDownEvents: SignalData[] | undefined,
    keyUpEvents: SignalData[] | undefined
  ): { averageDwell: number; dwellCount: number } {
    if (!keyDownEvents || !keyUpEvents || keyDownEvents.length === 0 || keyUpEvents.length === 0) {
      return { averageDwell: 0, dwellCount: 0 };
    }

    const dwellTimes: number[] = [];
    const keyDownMap: Record<string, { ts: number; k: string | undefined; c: string | undefined }> =
      {};

    const allKeyEvents = [...keyDownEvents, ...keyUpEvents].sort((a, b) => a.ts - b.ts);

    for (const event of allKeyEvents) {
      const keyIdentifier = event.c ?? event.k;
      if (!keyIdentifier) continue;

      const isKeyDown = keyDownEvents.some(
        (kde) => kde.ts === event.ts && (kde.c === event.c || kde.k === event.k)
      );
      const isKeyUp = keyUpEvents.some(
        (kue) => kue.ts === event.ts && (kue.c === event.c || kue.k === event.k)
      );

      if (isKeyDown) {
        keyDownMap[keyIdentifier] = { ts: event.ts, k: event.k, c: event.c };
      } else if (isKeyUp) {
        if (keyDownMap[keyIdentifier]) {
          const keyDownTime = keyDownMap[keyIdentifier].ts;
          const duration = event.ts - keyDownTime;
          const originalKeyDown = keyDownMap[keyIdentifier];
          const keyMatch =
            (originalKeyDown.k && originalKeyDown.k === event.k) ??
            (originalKeyDown.c && originalKeyDown.c === event.c) ??
            (!originalKeyDown.k && !originalKeyDown.c);

          if (duration > 0 && duration < 3000 && keyMatch) {
            dwellTimes.push(duration);
          }
          delete keyDownMap[keyIdentifier];
        }
      }
    }
    if (dwellTimes.length === 0) return { averageDwell: 0, dwellCount: 0 };
    const avgDwell = dwellTimes.reduce((sum, d) => sum + d, 0) / dwellTimes.length;
    return {
      averageDwell: parseFloat(avgDwell.toFixed(0)),
      dwellCount: dwellTimes.length,
    };
  }

  /**
   * Calculates all relevant features from the collected signal data.
   * @param collectedData - The collected signal data.
   * @returns An object with all the calculated features.
   */
  public static calculateFeatures(
    collectedData: CollectedSignalData,
    fingerprintComponents: FingerprintComponents,
    capabilities: Record<string, boolean> | undefined
  ): CalculatedFeatures {
    const pointerMoveEvents =
      collectedData.pointermove || collectedData.mousemove || collectedData.touchmove;
    const keyDownEvents = collectedData.keydown;
    const keyUpEvents = collectedData.keyup;
    const clickEventsCombined = [...(collectedData.click || []), ...(collectedData.dblclick || [])];
    const pointerDownEvents = collectedData.pointerdown || collectedData.mousedown;
    const pointerUpEvents = collectedData.pointerup || collectedData.mouseup;
    const touchStartEvents = collectedData.touchstart;
    const focusEvents = collectedData.focus;
    const blurEvents = collectedData.blur;
    const inputEventsCombined = [...(collectedData.input || []), ...(collectedData.change || [])];
    const scrollEvents = collectedData.scroll;
    const visibilityChangeEvents = collectedData.visibilitychange;
    const copyEvents = collectedData.copy;
    const pasteEvents = collectedData.paste;

    const pointerSpeeds = this.extractNumericValues(pointerMoveEvents, 's');
    const pointerDeltaTimes = this.extractNumericValues(pointerMoveEvents, 'dt');
    const keyDownDeltaTimes = this.extractNumericValues(keyDownEvents, 'dt');

    const pointerSpeedStats = this.calculateStats(pointerSpeeds);
    const pointerDtStats = this.calculateStats(pointerDeltaTimes);
    const keyDownDtStats = this.calculateStats(keyDownDeltaTimes);

    const viewportEvents = [
      ...(collectedData.click || []),
      ...(collectedData.focus || []),
      ...(pointerDownEvents || []),
    ];

    const totalPointerDistance = this.calculateTotalPointerDistance(pointerMoveEvents);
    const clickDurationStats = this.calculateAverageClickDuration(
      pointerDownEvents,
      pointerUpEvents
    );
    const backspaceKeyPressCount = this.countSpecificKeyPress(keyDownEvents, 'Backspace');
    const enterKeyPressCount = this.countSpecificKeyPress(keyDownEvents, 'Enter');
    const dwellTimeStats = this.calculateAverageDwellTime(keyDownEvents, keyUpEvents);

    // I created interface FingerprintComponentsFeatures to extract typed features from fingerprintComponents
    const castedFPComponents = fingerprintComponents as unknown as FingerprintComponentsFeatures;
    let userCapabilities = undefined;
    if (capabilities) {
      userCapabilities = capabilities;
    } else {
      userCapabilities = this.pickRandomCapabilities(
        5,
        castedFPComponents?.browser?.capabilities ?? {}
      );
    }

    const features: CalculatedFeatures = {
      sessionDurationSeconds: this.calculateSessionDuration(collectedData),
      totalEventCount: this.countTotalEvents(collectedData),
      pointerMoveCount: pointerMoveEvents?.length || 0,
      keyDownCount: keyDownEvents?.length || 0,
      keyUpCount: keyUpEvents?.length || 0,
      clickCount:
        clickDurationStats.clickCount > 0
          ? clickDurationStats.clickCount
          : clickEventsCombined?.length || 0,
      touchStartCount: touchStartEvents?.length || 0,
      focusCount: focusEvents?.length || 0,
      blurCount: blurEvents?.length || 0,
      inputChangeCount: inputEventsCombined?.length || 0,
      scrollCount: scrollEvents?.length || 0,
      visibilityChangeCount: visibilityChangeEvents?.length || 0,
      clipboardCopyCount: copyEvents?.length || 0,
      clipboardPasteCount: pasteEvents?.length || 0,
      averagePointerSpeedPixelsPerSecond: pointerSpeedStats.mean,
      stdDevPointerSpeedPixelsPerSecond: pointerSpeedStats.stddev,
      averagePointerDeltaTimeMs: pointerDtStats.mean,
      pointerTypeRatio: this.calculatePointerTypeMix(pointerMoveEvents),
      totalPointerDistance: totalPointerDistance,
      averageClickDurationMs: clickDurationStats.averageDuration,
      averageKeyDownDeltaTimeMs: keyDownDtStats.mean,
      stdDevKeyDownDeltaTimeMs: keyDownDtStats.stddev,
      tabKeyPressCount: this.countSpecificKeyPress(keyDownEvents, 'Tab'),
      backspaceKeyPressCount: backspaceKeyPressCount,
      enterKeyPressCount: enterKeyPressCount,
      averageDwellTimeMs: dwellTimeStats.averageDwell,
      dwellTimeEventCount: dwellTimeStats.dwellCount,
      distinctTargetInteractionCount: this.countDistinctTargetNames(collectedData),
      averageFocusDurationMs: this.calculateAverageFocusDuration(focusEvents, blurEvents),
      maxScrollYPosition: this.findMaxScrollY(scrollEvents),
      averageViewportWidth: this.calculateAverageViewport(viewportEvents, 'vw'),
      averageViewportHeight: this.calculateAverageViewport(viewportEvents, 'vh'),

      // fingerprint components
      os: castedFPComponents?.browser?.os ?? '',
      language: castedFPComponents?.language?.language ?? '',
      screenWidth: castedFPComponents?.screen?.width ?? '',
      screenHeight: castedFPComponents?.screen?.height ?? '',
      colorDepth: castedFPComponents?.screen?.colorDepth ?? '',
      timezoneOffset: castedFPComponents?.timezone?.timezoneOffset,
      webglVendor: castedFPComponents?.webgl?.vendor ?? '',
      webglRenderer: castedFPComponents?.webgl?.renderer ?? '',
      ...userCapabilities,
    };
    return features;
  }

  public static pickRandomCapabilities(
    maxKeys = 5,
    capabilities: Record<string, boolean>
  ): Record<string, boolean> {
    const keys = Object.keys(capabilities);
    const randomKeys = new Set<string>();
    while (randomKeys.size < maxKeys && randomKeys.size < keys.length) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      randomKeys.add(randomKey);
    }
    const pickedCapabilities: Record<string, boolean> = {};
    randomKeys.forEach((key) => {
      pickedCapabilities[key] = capabilities[key];
    });
    return pickedCapabilities;
  }
}
