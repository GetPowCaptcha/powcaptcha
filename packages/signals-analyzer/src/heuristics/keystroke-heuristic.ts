import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

export class KeystrokeHeuristic implements HeuristicSource {
  readonly key = 'keystrokes';

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,
    constants: Pick<
      HeuristicConstants,
      | 'MIN_KEY_EVENTS_FOR_SPEED'
      | 'TYPING_SPEED_THRESHOLD_WPM'
      | 'UNNATURAL_TIMING_PENALTY'
      | 'HUMAN_LIKE_PATTERN_BONUS'
      | 'KEY_INTERVAL_MIN_MS'
      | 'KEY_INTERVAL_MAX_MS'
      | 'KEY_DURATION_MIN_MS'
      | 'KEY_DURATION_MAX_MS'
    >
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];
    const keydowns = data.keydown || [];
    const keyups = data.keyup || [];

    if (keydowns.length < constants.MIN_KEY_EVENTS_FOR_SPEED) {
      logs.push(
        `Info: Insufficient keyboard events (${keydowns.length}) for detailed typing analysis.`
      );
      return { scoreDelta, logs };
    }

    const firstKeyTime = keydowns[0].ts;
    const lastKeyTime = keydowns[keydowns.length - 1].ts;
    const durationMs = lastKeyTime - firstKeyTime;
    if (durationMs > 0) {
      const durationMinutes = durationMs / (1000 * 60);
      const estimatedWPM = keydowns.length / 5.5 / durationMinutes;
      logs.push(`Info: Estimated typing speed: ${estimatedWPM.toFixed(0)} WPM.`);
      if (estimatedWPM > constants.TYPING_SPEED_THRESHOLD_WPM) {
        // Unnatural timing penalty is a negative number
        scoreDelta += constants.UNNATURAL_TIMING_PENALTY * 1.2;

        logs.push(
          `Penalty: Estimated typing speed (${estimatedWPM.toFixed(0)} WPM) is suspiciously high.`
        );
      } else if (estimatedWPM > 10) {
        scoreDelta += constants.HUMAN_LIKE_PATTERN_BONUS * 0.2;
        logs.push(`Minor bonus: Plausible typing speed detected.`);
      }
    }

    let totalInterval = 0,
      totalDuration = 0,
      intervalCount = 0,
      durationCount = 0;
    let suspiciousIntervals = 0,
      suspiciousDurations = 0;
    for (let i = 1; i < keydowns.length; i++) {
      const interval = keydowns[i].ts - keydowns[i - 1].ts;
      if (interval > 0) {
        totalInterval += interval;
        intervalCount++;
        if (interval < constants.KEY_INTERVAL_MIN_MS || interval > constants.KEY_INTERVAL_MAX_MS)
          suspiciousIntervals++;
      }
    }
    keydowns.forEach((down) => {
      const up = keyups.find((u) => u.k === down.k && u.tid === down.tid && u.ts > down.ts);
      if (up) {
        const duration = up.ts - down.ts;
        if (duration > 0) {
          totalDuration += duration;
          durationCount++;
          if (duration < constants.KEY_DURATION_MIN_MS || duration > constants.KEY_DURATION_MAX_MS)
            suspiciousDurations++;
        }
      }
    });
    const avgInterval = intervalCount > 0 ? totalInterval / intervalCount : 0;
    const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;
    logs.push(
      `Keyboard Timings: Average interval=${avgInterval.toFixed(
        1
      )}ms, Average duration=${avgDuration.toFixed(1)}ms`
    );
    const suspiciousIntervalRatio = intervalCount > 0 ? suspiciousIntervals / intervalCount : 0;
    const suspiciousDurationRatio = durationCount > 0 ? suspiciousDurations / durationCount : 0;
    if (suspiciousIntervalRatio > 0.3) {
      scoreDelta += constants.UNNATURAL_TIMING_PENALTY * 0.5;
      logs.push(
        `Penalty: High proportion (${(suspiciousIntervalRatio * 100).toFixed(
          0
        )}%) of suspicious key intervals detected.`
      );
    }
    if (suspiciousDurationRatio > 0.3) {
      scoreDelta += constants.UNNATURAL_TIMING_PENALTY * 0.5;
      logs.push(
        `Penalty: High proportion (${(suspiciousDurationRatio * 100).toFixed(
          0
        )}%) of suspicious key durations detected.`
      );
    }

    return { scoreDelta, logs };
  }
}
