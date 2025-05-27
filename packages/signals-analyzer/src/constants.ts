/**
 * Configuration constants for signal analysis heuristics.
 */
const AnalyzerConstants = {
  // Typing Analysis
  TYPING_SPEED_THRESHOLD_WPM: 120, // WPM considered suspiciously high
  MIN_KEY_EVENTS_FOR_SPEED: 5, // Minimum keydowns needed to estimate speed
  KEY_INTERVAL_MIN_MS: 15, // Minimum plausible time between key presses
  KEY_INTERVAL_MAX_MS: 1000, // Maximum plausible time between key presses (can be adjusted)
  KEY_DURATION_MIN_MS: 10, // Minimum plausible key hold duration
  KEY_DURATION_MAX_MS: 500, // Maximum plausible key hold duration

  // Event Sequence & Context Analysis
  PRECEDING_ACTION_INTERVAL_MS: 2500, // Max time between focus/click and subsequent input
  INPUT_WITHOUT_FOCUS_OR_CLICK_PENALTY: -0.015, // Base penalty for input without prior action
  ENTER_SUBMIT_INTERVAL_MS: 100, // Max time between Enter keydown and potential synthetic submit click
  SUSPICIOUS_SEQUENCE_PENALTY: -0.1, // Base penalty for suspicious sequences (like rapid paste->submit)
  RAPID_SUBMIT_INTERVAL_MS: 500, // Time threshold in ms for "rapid" submit after paste

  // Pointer Movement Analysis
  POINTER_MOVE_MIN_COUNT: 2, // Minimum moves needed for analysis
  POINTER_MAX_SPEED_PPS: 5000, // Max plausible pointer speed (pixels per second)
  POINTER_MIN_HESITATION_MS: 80, // Minimum pause duration considered a hesitation

  // Paste Event Analysis Constants
  SENSITIVE_PASTE_FIELD_TYPES: [
    'email',
    'password',
    'tel',
    'url',
    'search',
    'date',
    'datetime-local',
    'month',
    'week',
    'time',
    'color',
  ],
  SENSITIVE_PASTE_NAME_KEYWORDS: [
    'username',
    'userid',
    'user_id',
    'login',
    'auth',
    'code',
    'token',
    'key',
    'id',
    'card',
    'iban',
    'account',
    'phone',
    'postcode',
    'postal_code',
    'zip',
    'totp',
    'mfa',
    '2fa',
    'otp',
    'tracking',
    'coupon',
    'voucher',
    'license',
    'serial',
  ],
  BASE_PASTE_PENALTY: -0.08,
  LOW_SENSITIVITY_PASTE_MULTIPLIER: 0.2,
  HIGH_SENSITIVITY_PASTE_MULTIPLIER: 1.0,
  PASTE_COUNT_PENALTY_THRESHOLD: 1,
  PASTE_PENALTY_SCALING_FACTOR: 1.1,

  // Global Timing & Bonuses/Penalties
  SCROLL_SCORE_BONUS: 0.08,
  MAX_BONUS_SCROLL: 0.24, // Limit
  DBLCLICK_SCORE_BONUS: 0.04,
  VISIBILITY_CHANGE_BONUS: 0.15,
  MAX_VISIBILITY_CHANGE_BONUS: 0.3, // Limit
  UNNATURAL_TIMING_PENALTY: -0.18,
  HUMAN_LIKE_PATTERN_BONUS: 0.12,
  FAST_COMPLETION_PENALTY: -0.2,
  SLOW_COMPLETION_BONUS: 0.1,
  MAX_BONUS_SLOW_COMPLETION: 0.3, // Limit
  MIN_DURATION_THRESHOLD_MS: 1500, // Minimum expected duration for non-trivial interaction
  MIN_EVENTS_FOR_DURATION_PENALTY: 5, // Min events needed to apply fast completion penalty
  ENTER_SUBMIT_BONUS: 0.02,

  PERFECT_TIMING_THRESHOLD_MS: 50,
  LINEARITY_THRESHOLD_HIGH: 0.8,
  LINEARITY_THRESHOLD_LOW: 0.3,
  RAPID_FIELD_SWITCH_THRESHOLD_MS: 100,
};

// Type alias
export type HeuristicConstants = typeof AnalyzerConstants;

export { AnalyzerConstants };
