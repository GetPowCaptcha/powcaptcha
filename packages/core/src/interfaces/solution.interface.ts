/**
 * Represents the solution to a challenge.
 *
 * @interface SolutionInterface
 * @property {string} challenge_id - The unique identifier of the challenge.
 * @property {number} time - The time taken to solve the challenge, in milliseconds.
 * @property {Array<number>} solutions - An array of solution values.
 */
export interface SolutionInterface {
  challenge_id: string;
  time: number;
  solutions: number[] | null[];
}
