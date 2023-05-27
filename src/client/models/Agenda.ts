import bs58 from 'bs58';
import * as borsh from '@project-serum/borsh';
import * as anchor from '@project-serum/anchor';
import {PublicKey} from '@solana/web3.js';
import {PROGRAM_KEYPAIR} from '../constants';

export class Agenda {
  constructor(
    public id: number,
    public name: string,
    public owner: PublicKey,
  ) {}

  publicKey(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [this.owner.toBuffer(), Buffer.from(this.name)],
      PROGRAM_KEYPAIR.publicKey,
    )[0];
  }

  borshInstructionSchema = borsh.struct([
    borsh.u8('variant'),
    borsh.u64('id'),
    borsh.str('name'),
  ]);

  // its very important than the order defined here is the same order in the program in which we store the data in the account
  static borshAccountSchema = borsh.struct([
    borsh.str('discriminator'),
    borsh.bool('initialized'),
    borsh.u64('id'),
    borsh.str('name'),
    borsh.publicKey('owner'),
  ]);

  serialize(instruction: number): Buffer {
    const buffer = Buffer.alloc(1000);
    this.borshInstructionSchema.encode(
      {id: new anchor.BN(this.id), name: this.name, variant: instruction},
      buffer,
    );
    return buffer.slice(0, this.borshInstructionSchema.getSpan(buffer));
  }

  static deserialize(buffer?: Buffer): Agenda | null {
    if (!buffer) {
      return null;
    }

    try {
      const {id, name, owner} = this.borshAccountSchema.decode(buffer);
      return new Agenda(id.toNumber(), name, owner);
    } catch (e) {
      console.log('Deserialization error:', e);
      return null;
    }
  }
}
