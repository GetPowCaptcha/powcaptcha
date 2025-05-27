import { createLogger } from '@powcaptcha/logger';

import type {
  AttachedListenerInfo,
  CollectedSignalData,
  CollectorSource,
  OnCollectedCallback,
} from './types';
export * from './types';
import { extractEventData } from './utils/extract-event-data';

import {
  DEFAULT_MAX_COLLECT_EVENTS,
  DEFAULT_MAX_COLLECT_TIME_MS,
  MOVE_THROTTLE_MS,
} from './constants';
import { defaultCollectorSources } from './sources';
const Logger = createLogger('signals:signals');

export interface SignalsConfig {
  maxCollectTimeMs?: number;
  maxCollectEvents?: number;
  collectorSources?: CollectorSource[];
}
/**
 * Signals Collector
 *
 * The `Signals` class is responsible for orchestrating the collection of user interaction signals
 * by utilizing specialized `CollectorSource` modules to attach event listeners. It manages the
 * lifecycle of signal collection, processes events centrally, and provides mechanisms to retrieve
 * or clear collected data.
 */
export class Signals {
  private collectedSignalsData: CollectedSignalData = {};
  private maxCollectTimeMs: number = DEFAULT_MAX_COLLECT_TIME_MS;
  private maxCollectEvents: number = DEFAULT_MAX_COLLECT_EVENTS;
  private activeListeners: AttachedListenerInfo[] = [];
  private globalTimeoutId: number | null = null;
  // The main element being observed
  private targetElement: HTMLElement | null = null;
  private onCollectedCallback: OnCollectedCallback | null = null;
  private collectionStopped = false;

  // Throttling state
  private lastMoveTimestamp = 0;
  private readonly throttleInterval: number = MOVE_THROTTLE_MS;

  // Sources used for attaching listeners
  private collectorSources: CollectorSource[];

  /**
   * Constructor for the Signals class.
   * @param config Configuration object for the Signals collector.
   */
  constructor(config: SignalsConfig = {}) {
    this.maxCollectTimeMs = config.maxCollectTimeMs ?? DEFAULT_MAX_COLLECT_TIME_MS;
    this.maxCollectEvents = config.maxCollectEvents ?? DEFAULT_MAX_COLLECT_EVENTS;
    this.collectorSources = config.collectorSources ?? defaultCollectorSources;
  }
  /**
   * Starts event collection on the target element.
   * Stops on the 'submit' event (if target is a form) or after 'maxDurationMs'.
   *
   * @param targetElement The HTMLElement to attach listeners to (e.g., form).
   * @param maxDurationMs Maximum collection duration in ms (overrides default).
   * @param onCollected Callback function executed when collection finishes.
   */
  public collect(
    targetElement: HTMLElement,
    maxDurationMs?: number,
    onCollected?: OnCollectedCallback
  ): void {
    // Ensure running in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      Logger.error('Signals: Cannot run outside of a browser environment.');
      return;
    }
    this.clearCollectedSignals();

    this.collectedSignalsData.gt = [
      {
        ts: performance.now(),
      },
    ];

    this.targetElement = targetElement;
    this.maxCollectTimeMs = maxDurationMs ?? DEFAULT_MAX_COLLECT_TIME_MS;
    this.onCollectedCallback = onCollected ?? null;

    this.collectionStopped = false;

    Logger.log(
      `Signals: Starting collection on element [${
        targetElement.id || targetElement.tagName
      }]. Max duration: ${this.maxCollectTimeMs}ms or until submit.`
    );

    const globalTargets = { window, document };

    const centralHandler = this.handleEvent.bind(this);
    let attachedListeners: AttachedListenerInfo[] = [];

    this.collectorSources.forEach((source) => {
      try {
        Logger.log(`Signals: Attaching listeners for source: ${source.key}`);
        const listenersFromSource = source.attachListeners(
          this.targetElement!,
          globalTargets,
          centralHandler
        );
        attachedListeners = attachedListeners.concat(listenersFromSource);
      } catch (error) {
        Logger.error(`Signals: Error attaching listeners for source ${source.key}:`, error);
      }
    });
    this.activeListeners = attachedListeners;
    Logger.log(`Signals: Attached ${this.activeListeners.length} listeners in total.`);
    if (this.maxCollectTimeMs > 0) {
      this.globalTimeoutId = window.setTimeout(() => {
        if (!this.collectionStopped) {
          Logger.log(
            `Signals: Finalizing collection due to maximum timeout (${this.maxCollectTimeMs}ms).`
          );
          this.finalizeCollection();
        }
      }, this.maxCollectTimeMs);
    }
  }

  /**
   * Centralized event handler. Called by all attached listeners via binding.
   * Applies throttling, extracts data, stores it, and checks for stop conditions.
   * @param e The captured DOM Event.
   */
  private handleEvent(e: Event): void {
    if (this.collectionStopped) return;

    try {
      const eventType = e.type;

      const now = performance.now(); // Use high-resolution time

      // Throttling for move events
      if (eventType === 'pointermove' || eventType === 'mousemove' || eventType === 'touchmove') {
        if (now - this.lastMoveTimestamp < this.throttleInterval) return;
        this.lastMoveTimestamp = now;
      }

      const signalData = extractEventData(e, now);

      const prevSignals = this.collectedSignalsData[eventType];
      if (prevSignals?.length > 0) {
        const lastSignal = prevSignals[prevSignals.length - 1];
        signalData.dt = now - lastSignal.ts;
        if (
          (eventType === 'pointermove' || eventType === 'mousemove' || eventType === 'touchmove') &&
          signalData.x !== undefined &&
          signalData.y !== undefined &&
          lastSignal.x !== undefined &&
          lastSignal.y !== undefined &&
          signalData.dt > 0
        ) {
          const dx = signalData.x - lastSignal.x;
          const dy = signalData.y - lastSignal.y;
          signalData.d = Math.sqrt(dx * dx + dy * dy);
          signalData.s = signalData.d / (signalData.dt / 1000);
        }
      }
      // Store Data
      if (!this.collectedSignalsData[eventType]) {
        this.collectedSignalsData[eventType] = [];
      }
      if (this.collectedSignalsData[eventType].length >= this.maxCollectEvents) {
        Logger.log(
          `Signals: Maximum number of events (${this.maxCollectEvents}) reached for event type: ${eventType}.`
        );
        // remove the oldest event
        this.collectedSignalsData[eventType].shift();
      }

      this.collectedSignalsData[eventType].push(signalData);
    } catch (error) {
      Logger.error(`Signals: Error handling event ${e.type}:`, error);
    }
  }

  /**
   * Finalizes the collection process, stops listeners/timers, and calls the callback.
   */
  public finalizeCollection(): void {
    if (this.collectionStopped) return;
    this.collectionStopped = true;
    Logger.log('Signals: Finalizing collection...');

    this.stopAllCollecting();
    this.collectedSignalsData.gt.push({
      ts: performance.now(),
    });

    if (this.onCollectedCallback) {
      try {
        Logger.log(
          'Signals: Executing onCollected callback with final data.',
          Object.keys(this.collectedSignalsData).length > 0
            ? '(Data included)'
            : '(No data collected)'
        );
        this.onCollectedCallback(this.collectedSignalsData);
      } catch (error) {
        Logger.error('Signals: Error executing onCollected callback:', error);
      }
    } else {
      Logger.log(
        'Signals: Collection finished. No callback provided.',
        Object.keys(this.collectedSignalsData).length > 0
          ? '(Data collected)'
          : '(No data collected)'
      );
    }
  }

  /**
   * Stops all active event listeners and cancels the global timeout.
   */
  private stopAllCollecting(): void {
    Logger.log(`Signals: Detaching ${this.activeListeners.length} listeners...`);
    this.activeListeners.forEach((listenerInfo) => {
      try {
        listenerInfo.target.removeEventListener(
          listenerInfo.type,
          listenerInfo.handler,
          listenerInfo.capture
        );
      } catch (error) {
        Logger.warn(
          `Signals: Failed to remove listener ${listenerInfo.type} from target:`,
          listenerInfo.target,
          error
        );
      }
    });
    this.activeListeners = [];

    // Clear the global timeout
    if (this.globalTimeoutId !== null) {
      window.clearTimeout(this.globalTimeoutId);
      this.globalTimeoutId = null;
    }

    Logger.log('Signals: All listeners stopped and global timeout cancelled.');
  }

  /**
   * Returns the collected signal data.
   * @returns A collected signal data.
   */
  public getCollectedSignals(): CollectedSignalData {
    if (!this.collectionStopped) {
      Logger.warn('Collection still active. Returning incomplete data.');
    }
    return this.collectedSignalsData;
  }

  /**
   * Clears all collected signal data and resets internal state, including stopping any active listeners/timers.
   */
  public clearCollectedSignals(): void {
    this.stopAllCollecting();

    this.collectedSignalsData = {};
    this.lastMoveTimestamp = 0;
    this.collectionStopped = true;
    this.targetElement = null;
    this.onCollectedCallback = null;
    this.globalTimeoutId = null;

    Logger.log('Signals: Collected data, listeners, timeouts, and state cleared.');
  }
}
