import type { HeuristicSource } from '../types';

// Export individual heuristics
export { EventSequenceHeuristic } from './event-sequence-heuristic';
export { GlobalTimingHeuristic } from './global-timing-heuristic';
export { InputPatternsHeuristic } from './input-pattern-heuristic';
export { KeystrokeHeuristic } from './keystroke-heuristic';
export { LinearityHeuristic } from './linearity-heuristic';
export { PerfectTimingHeuristic } from './perfect-timing-heuristic';
export { PointerMovementHeuristic } from './pointer-movement-heuristic';
export { RapidSwitchingHeuristic } from './rapid-switching-heuristic';
export { ScrollHeuristic } from './scroll-heuristic';
export { VisibilityHeuristic } from './visibility-heuristic';

// Import implementations for default list
import { EventSequenceHeuristic } from './event-sequence-heuristic';
import { GlobalTimingHeuristic } from './global-timing-heuristic';
import { InputPatternsHeuristic } from './input-pattern-heuristic';
import { KeystrokeHeuristic } from './keystroke-heuristic';
import { LinearityHeuristic } from './linearity-heuristic';
import { PerfectTimingHeuristic } from './perfect-timing-heuristic';
import { PointerMovementHeuristic } from './pointer-movement-heuristic';
import { RapidSwitchingHeuristic } from './rapid-switching-heuristic';
import { ScrollHeuristic } from './scroll-heuristic';
import { VisibilityHeuristic } from './visibility-heuristic';

/**
 * Default list of heuristic source instances to run in the pipeline.
 * The order might influence context passed between heuristics if implemented later.
 */
export const defaultHeuristics: HeuristicSource[] = [
  new GlobalTimingHeuristic(),
  new PointerMovementHeuristic(),
  new KeystrokeHeuristic(),
  new EventSequenceHeuristic(), // Includes input w/o focus, paste->submit
  new InputPatternsHeuristic(), // Focuses on paste context/frequency
  new ScrollHeuristic(),
  new VisibilityHeuristic(),
  new PerfectTimingHeuristic(), // Detects suspiciously perfect timing patterns
  new LinearityHeuristic(), // Detects suspiciously linear mouse movements
  new RapidSwitchingHeuristic(), // Detects rapid field switching
];
