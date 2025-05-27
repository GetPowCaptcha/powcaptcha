import type { ChallengeInterface } from '@powcaptcha/core';
import type { CollectedSignalData } from '@powcaptcha/signals';

export interface SolvedDetail {
  token: string;
}
export interface ErrorDetail {
  error: Error;
}

export interface SolveProgressDetail {
  progress: number;
}

export interface CreateChallengeConfig {
  appId: string;
  backendUrl: string;
  signalsData: CollectedSignalData;
  fingerprint: string;
  context?: string;
}

export interface SolveChallengeConfig {
  challenge: ChallengeInterface;
  abortController: AbortController;
  onProgress: (progress: number) => void;
}

export interface CreateChallengeSuccessResponseInterface {
  success: true;
  type: 'item';
  data: ChallengeInterface;
}
export interface CreateChallengeErrorResponseInterface {
  success: false;
  type: 'error';
  message: string;
  error: {
    code: number;
    message: string;
  };
}
export type CreateChallengeResponseInterface =
  | CreateChallengeSuccessResponseInterface
  | CreateChallengeErrorResponseInterface;

export interface VerifyErrorResponseInterface {
  success: false;
  type: 'error';
  message: string;
  error: {
    code: number;
    message: string;
  };
}
export interface VerifySuccessResponseInterface {
  success: true;
  type: 'item';
  data?: {
    context?: string;
    signals: {
      score: number;
    };
    spamFilter?: {
      took: number;
      score: number;
      text: {
        score: number;
        languages: string[];
        reasons: string[];
      };
      email: {
        score: number;
        reasons: string[];
      };
    };
    visitor: {
      id: string;
      continent: string;
      country: string;
      region: string;
      city: string;
      postalCode: string;
      timezone: string;
      isEUCountry: string;
      latitude: string;
      longitude: string;
    };
  };
}

export type VerifyResponseInterface = VerifyErrorResponseInterface | VerifySuccessResponseInterface;

declare global {
  interface HTMLElementEventMap {
    '@powcaptcha/widget/solved': CustomEvent<SolvedDetail>;
    '@powcaptcha/widget/error': CustomEvent<ErrorDetail>;
    '@powcaptcha/widget/solving': Event;
    '@powcaptcha/widget/solving/progress': CustomEvent<SolveProgressDetail>;
  }
}
