import { type ChallengeInterface, createChallenge, CreateChallengeParams } from '@powcaptcha/core';

import { APP_ID, SECRET } from './constants-example';

/**
 * Simulate server api, storing challenges and checking if the challenge is valid.
 */
export default class ServerExample {
  // In order to simulate a server, we need to store the challenges
  // that were created and check if the challenge is valid.
  // in a real server this would be stored in a database like redis
  private challenges_id: string[] = [];

  /*   private users = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@test.com",
    },
  ]; */

  private applications = [
    {
      id: APP_ID,
      user_id: 1,
      name: 'Test Application',
      secret: SECRET,
    },
  ];

  // last created challenge time
  private lastChallengeTime = 0;

  createChallenge = async (
    params: CreateChallengeParams & { app_id: string }
  ): Promise<ChallengeInterface> => {
    // increment difficulty if the last challenge was created less than 1 minute ago
    // this simulates a server that increases the difficulty if the user is creating challenges too fast
    if (Date.now() - this.lastChallengeTime < 60 * 1000) {
      console.log('Incrementing difficulty');
      params.difficulty = params.difficulty ? params.difficulty + 1 : 4;
      if (params.variableDifficulty) {
        params.variableDifficulty.min = params.variableDifficulty.min + 1;
        params.variableDifficulty.max = params.variableDifficulty.max + 1;
      }
    }

    // get the application
    const app = this.applications.find((app) => app.id === params.app_id);
    if (!app) {
      throw new Error('Application not found');
    }
    const challenge = await createChallenge({
      ...params,
      secret: app.secret,
    });
    this.challenges_id.push(challenge.id);
    this.lastChallengeTime = Date.now();
    return challenge;
  };
}
