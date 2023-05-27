import bs58 from 'bs58';
import * as borsh from '@project-serum/borsh';
import {PublicKey} from '@solana/web3.js';
import {PROGRAM_KEYPAIR} from '../constants';

export class Agenda {
  constructor(public name: string, public owner: PublicKey) {}

  publicKey(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [this.owner.toBuffer(), Buffer.from(this.name)],
      PROGRAM_KEYPAIR.publicKey,
    )[0];
  }

  borshInstructionSchema = borsh.struct([
    borsh.u8('variant'),
    borsh.str('name'),
  ]);

  // its very important than the order defined here is the same order in the program in which we store the data in the account
  static borshAccountSchema = borsh.struct([
    borsh.str('discriminator'),
    borsh.bool('initialized'),
    borsh.str('name'),
    borsh.publicKey('owner'),
  ]);

  serialize(instruction: number): Buffer {
    const buffer = Buffer.alloc(1000);
    this.borshInstructionSchema.encode(
      {name: this.name, variant: instruction},
      buffer,
    );
    return buffer.slice(0, this.borshInstructionSchema.getSpan(buffer));
  }

  static deserialize(buffer?: Buffer): Agenda | null {
    if (!buffer) {
      return null;
    }

    try {
      const {name, owner, initialized, discriminator} =
        this.borshAccountSchema.decode(buffer);
      return new Agenda(name, owner);
    } catch (e) {
      console.log('Deserialization error:', e);
      return null;
    }
  }
}
