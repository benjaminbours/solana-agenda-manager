import {AgendaCoordinator} from './coordinators/AgendaCoordinator';
import {establishConnection, checkProgram, create_agenda} from './scheduler';
import {getPayer} from './utils';

async function main() {
  // Establish connection to the cluster
  const connection = await establishConnection();
  // const payer = await getPayer();
  // Check if the program has been deployed
  await checkProgram(connection);

  //   const tx = await create_agenda(payer);
  //   console.log(tx);

  // Find out how many times that account has been greeted
  // await reportGreetings();
  const results = await AgendaCoordinator.fetchPage(connection, 1, 100, '');
  console.log(results);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
