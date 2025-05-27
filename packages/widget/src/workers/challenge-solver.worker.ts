import { type ChallengeItem, hashProblem } from '@powcaptcha/core';
import { detectNonSecureContextCryptoPolyfill } from '@powcaptcha/crypto';
detectNonSecureContextCryptoPolyfill();

self.onmessage = async (event: MessageEvent) => {
  const { challengeSignature, challengeItem, index } = event.data as {
    challengeSignature: string;
    challengeItem: ChallengeItem;
    index: number;
  };

  const problem = challengeItem.problem;
  const difficulty = challengeItem.difficulty;
  let n = 0;

  try {
    while (true) {
      const hash = await hashProblem(challengeSignature, problem, n);

      if (hash?.startsWith('0'.repeat(difficulty))) {
        self.postMessage({ index: index, solution: n, status: 'solved' });

        // self.close();
        break;
      }
      n++;
    }
  } catch (error) {
    console.error(`Worker ${index}: An error occurred while solving the challenge`, error);
    self.postMessage({
      index: index,
      error: error instanceof Error ? error.message : String(error),
      status: 'error',
    });
    // self.close();
  }
};

self.postMessage({ status: 'ready' });

self.onerror = (event) => {
  console.error('An error occurred in the worker:', event);
};

export {};
