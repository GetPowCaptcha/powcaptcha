/**
 * Server test
 */
import ClientExample from './client-example';
import { APP_ID, SECRET } from './constants-example';
import { Logger } from './logger';
import ServerExample from './server-example';

const debugElement = document.getElementById('debug-output');

const logger = new Logger(debugElement);

logger.time('powcaptcha');
const server = new ServerExample();

const client = new ClientExample();

const createChallengeParams = {
  secret: SECRET,
  app_id: APP_ID,
  challengesCount: 10,
  variableDifficulty: {
    min: 2,
    max: 4,
  },
};

void server.createChallenge(createChallengeParams).then(async (challenge) => {
  logger.log(challenge);
  logger.log(`Using secret: ${SECRET}`);
  const solution = await client.solveChallenge(challenge, logger);
  logger.timeEnd('powcaptcha');
  const isValid = await client.verifySolution(SECRET, solution, challenge);
  logger.log('Is solution valid?', isValid);

  // this will increment the difficulty
  void server.createChallenge(createChallengeParams);
});
