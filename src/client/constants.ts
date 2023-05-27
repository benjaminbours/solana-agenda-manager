import path from 'path';
import {createKeypairFromFile} from './utils';

const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');
const PROGRAM_NAME = 'scheduler';
export const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, `${PROGRAM_NAME}.so`);
const PROGRAM_KEYPAIR_PATH = path.join(
  PROGRAM_PATH,
  `${PROGRAM_NAME}-keypair.json`,
);

export const PROGRAM_KEYPAIR = createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
