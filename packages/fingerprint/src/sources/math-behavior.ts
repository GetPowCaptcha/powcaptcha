import type { FingerprintComponentValue } from '../types/fingerprint';
import { type Source } from '../types/source';

const KEY = 'mathBehavior';
export class MathBehaviorSource implements Source {
  public readonly key = KEY;
  public collect(): FingerprintComponentValue {
    return {
      // Math constants
      mathPi: Math.PI,
      mathE: Math.E,

      // Math functions behavior
      sinZero: Math.sin(0),
      cosPI: Math.cos(Math.PI),
      tanPI: Math.tan(Math.PI),

      // Float precision tests
      floatOperation: 0.1 + 0.2,
      maxValue: Math.max(0.1 + 0.2, 0.3),

      // Special numbers behavior
      infinity: 1 / 0,
      negativeInfinity: -1 / 0,
      nan: Math.sqrt(-1),

      // Rounding behavior
      roundPi: Math.round(Math.PI),
      floorPi: Math.floor(Math.PI),
      ceilPi: Math.ceil(Math.PI),
    };
  }
}
