/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import * as anchor from '@project-serum/anchor';
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import fs from 'mz/fs';
// import * as web3 from '@solana/web3.js';
import {Agenda} from './models/Agenda';

import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';
import {PROGRAM_KEYPAIR, PROGRAM_SO_PATH} from './constants';

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<Connection> {
  const rpcUrl = await getRpcUrl();
  const connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl, version);
  return connection;
}

// /**
//  * Establish an account to pay for everything
//  */
// export async function establishPayer(): Promise<void> {
//   let fees = 0;
//   if (!payer) {
//     const {blockhash} = await connection.getLatestBlockhash();
//     // blockhash.

//     // Calculate the cost to fund the greeter account
//     fees += await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);

//     // Calculate the cost of sending transactions
//     fees += feeCalculator.lamportsPerSignature * 100; // wag

//     payer = await getPayer();
//   }

//   let lamports = await connection.getBalance(payer.publicKey);
//   if (lamports < fees) {
//     // If current balance is not enough to pay for fees, request an airdrop
//     const sig = await connection.requestAirdrop(
//       payer.publicKey,
//       fees - lamports,
//     );
//     await connection.confirmTransaction(sig);
//     lamports = await connection.getBalance(payer.publicKey);
//   }

//   console.log(
//     'Using account',
//     payer.publicKey.toBase58(),
//     'containing',
//     lamports / LAMPORTS_PER_SOL,
//     'SOL to pay for fees',
//   );
// }

/**
 * Check if the hello world BPF program has been deployed
 */
export async function checkProgram(connection: Connection): Promise<void> {
  // Check if the program has been deployed
  const programInfo = await connection.getAccountInfo(
    PROGRAM_KEYPAIR.publicKey,
  );
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        'Program needs to be deployed with `solana program deploy dist/program/helloworld.so`',
      );
    } else {
      throw new Error('Program needs to be built and deployed');
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }
  console.log(`Using program ${PROGRAM_KEYPAIR.publicKey.toBase58()}`);
}

function numToUint8Array(num: number) {
  const arr = new Uint8Array(8);

  for (let i = 0; i < 8; i++) {
    arr[i] = num % 256;
    num = Math.floor(num / 256);
  }

  return arr;
}

// function uint8ArrayToNumV1(arr) {
//   let num = 0;

//   for (let i = 0; i < 8; i++) {
//     num += Math.pow(256, i) * arr[i];
//   }

//   return num;
// }

// function uint8ArrayToNumV2(arr) {
//   let num = 0;

//   for (let i = 7; i >= 0; i--) {
//     num = num * 256 + arr[i];
//   }

//   return num;
// }

class Assignable {
  [key: string]: any;
  constructor(properties: any) {
    Object.keys(properties).map(key => {
      // eslint-disable-next-line
      return (this[key] = properties[key]);
    });
  }
}

// Our instruction payload vocabulary
class Payload extends Assignable {}

// Borsh needs a schema describing the payload
const payloadSchema = new Map([
  [
    Payload,
    {
      kind: 'struct',
      fields: [
        ['variant', 'u8'],
        ['id', 'u64'],
        ['start_time', 'u64'],
        ['end_time', 'u64'],
      ],
    },
  ],
]);

// Instruction variant indexes
enum InstructionVariant {
  CreateAgenda = 0,
  UpdateAgenda,
  DeleteAgenda,
}

export async function create_agenda(
  connection: Connection,
  id: number,
  name: string,
  payer: Keypair,
): Promise<string> {
  console.log('create agenda');
  const agenda = new Agenda(id, name, payer.publicKey);
  const buffer = agenda.serialize(InstructionVariant.CreateAgenda);

  const [pda] = PublicKey.findProgramAddressSync(
    [payer.publicKey.toBuffer(), numToUint8Array(agenda.id)],
    PROGRAM_KEYPAIR.publicKey,
  );

  // const [pdaCounter] = PublicKey.findProgramAddressSync(
  //   [pda.toBuffer(), Buffer.from('event')],
  //   PROGRAM_KEYPAIR.publicKey,
  // );

  console.log(buffer);

  const instruction = new TransactionInstruction({
    keys: [
      {
        pubkey: payer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: pda,
        isSigner: false,
        isWritable: true,
      },
      // {
      //   pubkey: pdaCounter,
      //   isSigner: false,
      //   isWritable: true,
      // },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: PROGRAM_KEYPAIR.publicKey,
    data: buffer,
  });
  return await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

export async function update_agenda(
  connection: Connection,
  id: number,
  name: string,
  payer: Keypair,
): Promise<string> {
  console.log('create agenda');
  const agenda = new Agenda(id, name, payer.publicKey);
  const buffer = agenda.serialize(InstructionVariant.UpdateAgenda);

  const [pda] = PublicKey.findProgramAddressSync(
    [payer.publicKey.toBuffer(), new anchor.BN(agenda.id).toBuffer('le', 8)],
    PROGRAM_KEYPAIR.publicKey,
  );

  // const [pdaCounter] = PublicKey.findProgramAddressSync(
  //   [pda.toBuffer(), Buffer.from('event')],
  //   PROGRAM_KEYPAIR.publicKey,
  // );

  const instruction = new TransactionInstruction({
    keys: [
      {
        pubkey: payer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: pda,
        isSigner: false,
        isWritable: true,
      },
      // {
      //   pubkey: pdaCounter,
      //   isSigner: false,
      //   isWritable: true,
      // },
      // {
      //   pubkey: SystemProgram.programId,
      //   isSigner: false,
      //   isWritable: false,
      // },
    ],
    programId: PROGRAM_KEYPAIR.publicKey,
    data: buffer,
  });
  return await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

export async function delete_agenda(
  connection: Connection,
  id: number,
  name: string,
  payer: Keypair,
): Promise<string> {
  console.log('delete agenda');
  const agenda = new Agenda(id, name, payer.publicKey);
  const buffer = agenda.serialize(InstructionVariant.DeleteAgenda);

  const [pda] = PublicKey.findProgramAddressSync(
    [payer.publicKey.toBuffer(), new anchor.BN(agenda.id).toBuffer('le', 8)],
    PROGRAM_KEYPAIR.publicKey,
  );

  // const [pdaCounter] = PublicKey.findProgramAddressSync(
  //   [pda.toBuffer(), Buffer.from('event')],
  //   PROGRAM_KEYPAIR.publicKey,
  // );

  const instruction = new TransactionInstruction({
    keys: [
      {
        pubkey: payer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: pda,
        isSigner: false,
        isWritable: true,
      },
      // {
      //   pubkey: pdaCounter,
      //   isSigner: false,
      //   isWritable: true,
      // },
      // {
      //   pubkey: SystemProgram.programId,
      //   isSigner: false,
      //   isWritable: false,
      // },
    ],
    programId: PROGRAM_KEYPAIR.publicKey,
    data: buffer,
  });
  return await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

/**
 * Schedule
 */
// export async function create_event(payer: Keypair): Promise<string> {
//   console.log('Scheduling');
//   // Construct the payload
//   const payload = new Payload({
//     variant: InstructionVariant.CreateAgenda,
//     id: 10,
//     start_time: new Date(2023, 10, 1).getTime(), // 'ts key'
//     end_time: new Date(2023, 11, 1).getTime(), // 'ts first value'
//   });

//   const payloadSerBuf = Buffer.from(borsh.serialize(payloadSchema, payload));

//   const [pda] = PublicKey.findProgramAddressSync(
//     [payer.publicKey.toBuffer(), numToUint8Array(payload.id)],
//     programId,
//   );

//   console.log(payer.publicKey);
//   console.log(pda);

//   const instruction = new TransactionInstruction({
//     keys: [
//       {
//         pubkey: payer.publicKey,
//         isSigner: true,
//         isWritable: false,
//       },
//       {
//         pubkey: pda,
//         isSigner: false,
//         isWritable: true,
//       },
//       {
//         pubkey: SystemProgram.programId,
//         isSigner: false,
//         isWritable: false,
//       },
//     ],
//     programId,
//     data: payloadSerBuf,
//   });
//   return await sendAndConfirmTransaction(
//     connection,
//     new Transaction().add(instruction),
//     [payer],
//   );
// }

// /**
//  * Report the number of times the greeted account has been said hello to
//  */
// export async function reportGreetings(): Promise<void> {
//   const accountInfo = await connection.getAccountInfo(greetedPubkey);
//   if (accountInfo === null) {
//     throw 'Error: cannot find the greeted account';
//   }
//   const greeting = borsh.deserialize(
//     GreetingSchema,
//     GreetingAccount,
//     accountInfo.data,
//   );
//   console.log(
//     greetedPubkey.toBase58(),
//     'has been greeted',
//     greeting.counter,
//     'time(s)',
//   );
// }
