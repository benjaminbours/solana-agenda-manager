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
} from '../../scheduler';
import {getPayer} from '../../utils';

async function main() {
  // Establish connection to the cluster
  const connection = await establishConnection();
  const payer = await getPayer();
  // Check if the program has been deployed
  await checkProgram(connection);

  const id = Date.now();
  console.log(id);

  const tx = await create_agenda(connection, id, 'my-first-agenda', payer);
  console.log(tx);

  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
