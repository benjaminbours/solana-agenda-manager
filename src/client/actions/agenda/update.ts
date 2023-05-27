/**
 * Hello world
 */

import {
  establishConnection,
  // establishPayer,
  checkProgram,
  // create_event,
  update_agenda,
  // reportGreetings,
} from '../../scheduler';
import {getPayer} from '../../utils';

async function main() {
  // Establish connection to the cluster
  const connection = await establishConnection();
  const payer = await getPayer();
  // Check if the program has been deployed
  await checkProgram(connection);

  const tx = await update_agenda(
    connection,
    1685197728844,
    'my-first-agenda-updated',
    payer,
  );
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
