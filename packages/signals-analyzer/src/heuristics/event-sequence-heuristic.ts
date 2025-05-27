import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

export class EventSequenceHeuristic implements HeuristicSource {
  readonly key = 'eventSequences';

  analyze(
    data: CollectedSignalData,
    context: HeuristicContext,
    constants: Pick<
      HeuristicConstants,
      | 'DBLCLICK_SCORE_BONUS'
      | 'ENTER_SUBMIT_BONUS'
      | 'PRECEDING_ACTION_INTERVAL_MS'
      | 'HUMAN_LIKE_PATTERN_BONUS'
      | 'INPUT_WITHOUT_FOCUS_OR_CLICK_PENALTY'
      | 'SUSPICIOUS_SEQUENCE_PENALTY'
      | 'RAPID_SUBMIT_INTERVAL_MS'
    >
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];
    const { syntheticClickTimestamps } = context;

    const clicks = data.click || [];
    const pointerdowns = data.pointerdown || [];
    const dblclicks = data.dblclick || [];
    const inputs = data.input || [];
    const focuses = data.focus || [];
    const pastes = data.paste || [];
    const submits = data.submit || [];

    // DblClick Bonus
    if (dblclicks.length > 0) {
      scoreDelta += constants.DBLCLICK_SCORE_BONUS;
      logs.push(`Bonus: Detected ${dblclicks.length} double click event(s).`);
    }

    // Enter->Submit Bonus
    if (syntheticClickTimestamps.size > 0) {
      scoreDelta += constants.ENTER_SUBMIT_BONUS * syntheticClickTimestamps.size;
      logs.push(
        `Minor bonus: Detected ${syntheticClickTimestamps.size} potential Enter->Submit pattern(s).`
      );
    }

    // Input without Preceding Action Check
    let inputsWithoutPrecedingAction = 0,
      inputsWithPrecedingAction = 0;
    inputs.forEach((input) => {
      let precedingActionFound = false;
      const precedingFocus = focuses.find(
        (f) =>
          f.tid === input.tid &&
          f.ts < input.ts &&
          input.ts - f.ts < constants.PRECEDING_ACTION_INTERVAL_MS
      );
      if (precedingFocus) precedingActionFound = true;
      else {
        const precedingClick = clicks.find(
          (c) =>
            c.tid === input.tid &&
            c.ts < input.ts &&
            input.ts - c.ts < constants.PRECEDING_ACTION_INTERVAL_MS
        );
        if (precedingClick) precedingActionFound = true;
        else {
          const precedingPointerdown = pointerdowns.find(
            (p) =>
              p.tid === input.tid &&
              p.ts < input.ts &&
              input.ts - p.ts < constants.PRECEDING_ACTION_INTERVAL_MS
          );
          if (precedingPointerdown) precedingActionFound = true;
        }
      }
      if (precedingActionFound) inputsWithPrecedingAction++;
      else inputsWithoutPrecedingAction++;
    });
    if (inputs.length > 0) {
      if (inputsWithPrecedingAction > 0) {
        scoreDelta += constants.HUMAN_LIKE_PATTERN_BONUS * 0.3;
        logs.push(
          `Minor bonus: ${inputsWithPrecedingAction}/${inputs.length} 'input' event(s) were reasonably preceded by focus/click/pointerdown.`
        );
      }
      if (inputsWithoutPrecedingAction > 0) {
        logs.push(
          `Alert: ${inputsWithoutPrecedingAction}/${inputs.length} 'input' event(s) occurred WITHOUT a recent preceding focus/click/pointerdown.`
        );
        const badInputRatio = inputsWithoutPrecedingAction / inputs.length;
        const penaltyValue = constants.INPUT_WITHOUT_FOCUS_OR_CLICK_PENALTY * (1 + badInputRatio);
        scoreDelta += penaltyValue;
        logs.push(
          `Penalty: Applying penalty for inputs without preceding action: ${penaltyValue.toFixed(
            3
          )}`
        );
      }
    }

    // Paste -> Submit Sequence Check
    pastes.forEach((paste) => {
      const followingSubmitEvent = submits.find(
        (s) => s.ts > paste.ts && s.ts - paste.ts < constants.RAPID_SUBMIT_INTERVAL_MS
      );
      if (followingSubmitEvent) {
        scoreDelta -= constants.SUSPICIOUS_SEQUENCE_PENALTY * 1.5;
        logs.push(
          `Penalty: Detected rapid Paste -> Submit Event sequence (interval: ${(
            followingSubmitEvent.ts - paste.ts
          ).toFixed(0)}ms).`
        );
      } else {
        const followingSyntheticClick = clicks.find(
          (c) =>
            syntheticClickTimestamps.has(c.ts) &&
            c.ts > paste.ts &&
            c.ts - paste.ts < constants.RAPID_SUBMIT_INTERVAL_MS
        );
        if (followingSyntheticClick) {
          scoreDelta -= constants.SUSPICIOUS_SEQUENCE_PENALTY * 1.2;
          logs.push(
            `Penalty: Detected rapid Paste -> Synthetic Submit Click sequence (interval: ${(
              followingSyntheticClick.ts - paste.ts
            ).toFixed(0)}ms).`
          );
        }
      }
    });

    return { scoreDelta, logs };
  }
}
