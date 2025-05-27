import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

export class ScrollHeuristic implements HeuristicSource {
  readonly key = 'scroll';

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,

    constants: Pick<HeuristicConstants, 'SCROLL_SCORE_BONUS' | 'MAX_BONUS_SCROLL'>
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];
    const scrolls = data.scroll || [];

    if (scrolls.length > 0) {
      const potentialBonus = constants.SCROLL_SCORE_BONUS * scrolls.length;

      scoreDelta = Math.min(potentialBonus, constants.MAX_BONUS_SCROLL);

      logs.push(
        `Scroll Bonus: Detected ${
          scrolls.length
        } scroll event(s). Applied bonus: ${scoreDelta.toFixed(3)}.`
      );
    } else {
      logs.push('Scroll Info: No scroll events detected.');
    }

    return { scoreDelta, logs };
  }
}
