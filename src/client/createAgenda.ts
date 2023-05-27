/**
 * Hello world
 */

import {
  establishConnection,
  // establishPayer,
  checkProgram,
  // create_event,
  create_agenda,
  // reportGreetings,
} from './scheduler';
import {getPayer} from './utils';

async function main() {
  // Establish connection to the cluster
  const connection = await establishConnection();
  const payer = await getPayer();
  // Check if the program has been deployed
  await checkProgram(connection);

  const tx = await create_agenda(connection, 'my-first-agenda', payer);
  console.log(tx);

  // Find out how many times that account has been greeted
  // await reportGreetings();

  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
