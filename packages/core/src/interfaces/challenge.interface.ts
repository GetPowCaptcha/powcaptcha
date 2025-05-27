/**
 * Represents a challenge item with a specific difficulty level and problem statement.
 */
export interface ChallengeItem {
  /**
   * The difficulty level of the challenge.
   * Determines the number of leading zeros required in the SHA-256 hash.
   * For example:
   * - A difficulty of 1 requires 1 leading zero.
   * - A difficulty of 2 requires 2 leading zeros, and so on.
   */
  difficulty: number;

  /**
   * The problem statement associated with the challenge.
   */
  problem: string;
}

/**
 * Represents a challenge object used for solving a computational problem.
 *
 * @property id - The unique identifier for the challenge.
 *
 * @property signature - The signature used to verify the integrity of the challenge.
 * This is a SHA-256 hash of the concatenation of all challenges, including their version and id. It is used
 * to verify the validity of the challenge on the server.
 *  @see createChallengeSignature
 *
 * @property app_id - (Optional) The identifier of the application associated with the challenge.
 *
 * @property version - The version of the challenge object. Defaults to 1.
 *
 * @property challenges - A list of individual challenge items. This allows tracking
 * multiple challenges being resolved by the user, enabling features like progress
 * bars or indicators.
 *
 * @property ttl - The time-to-live for the challenge in milliseconds. Defaults to
 * 1 day (24 * 60 * 60 * 1000). A value of 0 indicates that the challenge never expires.
 */
export interface ChallengeInterface {
  id: string;
  signature: string;
  app_id?: string;
  request_id?: string;
  visitor_id?: string;
  version?: number;
  challenges: ChallengeItem[];
  ttl?: number;
}
