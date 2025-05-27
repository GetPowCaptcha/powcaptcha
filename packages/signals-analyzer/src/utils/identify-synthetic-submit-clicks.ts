import type { HeuristicConstants } from '../constants';
import type { CollectedSignalData } from '../types';

/**
 * Identifies clicks that were likely synthetically generated
 * by pressing Enter in a field to submit the form.
 * @param data The collected signal data.
 * @param constants Relevant heuristic constants.
 * @returns A Set containing the timestamps of the identified potential synthetic clicks.
 */
export function identifySyntheticSubmitClicks(
  data: CollectedSignalData,
  constants: Pick<HeuristicConstants, 'ENTER_SUBMIT_INTERVAL_MS'> // Only need specific constant
): Set<number> {
  const keydowns = data.keydown || [];
  const clicks = data.click || [];
  const syntheticClickTimestamps = new Set<number>();

  const inputTags = ['INPUT', 'TEXTAREA', 'SELECT']; // Tags where Enter might be pressed
  const submitTags = ['BUTTON', 'INPUT']; // Tags that can act as submit triggers

  keydowns.forEach((kd) => {
    if (kd.k === 'Enter' && kd.tg && inputTags.includes(kd.tg)) {
      const subsequentClick = clicks.find(
        (click) =>
          click.ts > kd.ts &&
          click.ts - kd.ts < constants.ENTER_SUBMIT_INTERVAL_MS &&
          click.tg &&
          submitTags.includes(click.tg) &&
          (click.tt === 'submit' ||
            (click.tg === 'BUTTON' && click.tt !== 'button' && click.tt !== 'reset'))
      );

      if (subsequentClick) {
        syntheticClickTimestamps.add(subsequentClick.ts);
      }
    }
  });

  return syntheticClickTimestamps;
}
