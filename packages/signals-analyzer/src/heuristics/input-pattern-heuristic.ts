import type { HeuristicConstants } from '../constants';
import type {
  AnalysisResult,
  CollectedSignalData,
  HeuristicContext,
  HeuristicSource,
} from '../types';

interface PasteEvent {
  tt?: string;
  tg?: string;
  tid?: string;
}

const MAX_PASTE_PENALTY = -0.3;

export class InputPatternsHeuristic implements HeuristicSource {
  readonly key = 'inputPatterns';

  analyze(
    data: CollectedSignalData,
    _context: HeuristicContext,
    constants: Pick<
      HeuristicConstants,
      | 'BASE_PASTE_PENALTY'
      | 'LOW_SENSITIVITY_PASTE_MULTIPLIER'
      | 'HIGH_SENSITIVITY_PASTE_MULTIPLIER'
      | 'PASTE_COUNT_PENALTY_THRESHOLD'
      | 'PASTE_PENALTY_SCALING_FACTOR'
      | 'SENSITIVE_PASTE_FIELD_TYPES'
      | 'SENSITIVE_PASTE_NAME_KEYWORDS'
    >
  ): AnalysisResult {
    let scoreDelta = 0;
    const logs: string[] = [];
    const pastes = data.paste || [];
    let totalPastePenalty = 0;
    let pasteCount = 0;

    if (pastes.length > 0) {
      logs.push(`Info: Analyzing ${pastes.length} paste event(s) with context (type/name checks).`);

      pastes.forEach((paste: PasteEvent) => {
        pasteCount++;
        const targetType = paste.tt?.toLowerCase();
        const targetName = paste.tg?.toLowerCase();
        const targetId = paste.tid?.toLowerCase();

        const isSensitiveField = this.isSensitiveField(targetType, targetName, targetId, constants);
        const penaltyMultiplier = isSensitiveField
          ? constants.LOW_SENSITIVITY_PASTE_MULTIPLIER
          : constants.HIGH_SENSITIVITY_PASTE_MULTIPLIER;

        const { penalty: currentPastePenalty, scalingFactor } = this.calculatePastePenalty(
          pasteCount,
          constants.BASE_PASTE_PENALTY,
          penaltyMultiplier,
          constants
        );

        if (currentPastePenalty < 0) {
          totalPastePenalty += currentPastePenalty;
          logs.push(
            `Penalty: Applying penalty for paste #${pasteCount}: ${currentPastePenalty.toFixed(3)} ` +
              `(Base: ${constants.BASE_PASTE_PENALTY}, Multiplier: ${penaltyMultiplier}, Scaling: ${scalingFactor.toFixed(2)})`
          );
        } else {
          logs.push(
            `Info: Paste #${pasteCount} is at or below the penalty threshold (${constants.PASTE_COUNT_PENALTY_THRESHOLD}). No penalty applied for this specific paste.`
          );
        }
      });

      if (totalPastePenalty < 0) {
        totalPastePenalty = Math.max(totalPastePenalty, MAX_PASTE_PENALTY);
        scoreDelta += totalPastePenalty;
        logs.push(
          `Penalty: Total penalty from ${pastes.length} paste events applied: ${totalPastePenalty.toFixed(3)}`
        );
      } else if (pastes.length > 0) {
        logs.push(
          `Info: No significant cumulative penalty from paste events (total calculated: ${totalPastePenalty.toFixed(3)}).`
        );
      }
    } else {
      logs.push(`Info: No paste events detected.`);
    }

    return { scoreDelta, logs };
  }

  private isSensitiveField(
    targetType: string | undefined,
    targetName: string | undefined,
    targetId: string | undefined,
    constants: Pick<
      HeuristicConstants,
      'SENSITIVE_PASTE_FIELD_TYPES' | 'SENSITIVE_PASTE_NAME_KEYWORDS'
    >
  ): boolean {
    if (targetType && constants.SENSITIVE_PASTE_FIELD_TYPES.includes(targetType)) {
      return true;
    }

    const checkForKeywords = (value: string | undefined): boolean =>
      value
        ? constants.SENSITIVE_PASTE_NAME_KEYWORDS.some((keyword) => value.includes(keyword))
        : false;

    return checkForKeywords(targetName) || checkForKeywords(targetId);
  }

  private calculatePastePenalty(
    pasteCount: number,
    basePenalty: number,
    multiplier: number,
    constants: Pick<
      HeuristicConstants,
      'PASTE_COUNT_PENALTY_THRESHOLD' | 'PASTE_PENALTY_SCALING_FACTOR'
    >
  ): { penalty: number; scalingFactor: number } {
    if (pasteCount <= constants.PASTE_COUNT_PENALTY_THRESHOLD) {
      return { penalty: 0, scalingFactor: 0 };
    }

    const scalingExponent = Math.max(0, pasteCount - constants.PASTE_COUNT_PENALTY_THRESHOLD - 1);
    const scalingFactor = Math.pow(constants.PASTE_PENALTY_SCALING_FACTOR, scalingExponent);
    const penalty = basePenalty * multiplier * scalingFactor;

    return { penalty, scalingFactor };
  }
}
