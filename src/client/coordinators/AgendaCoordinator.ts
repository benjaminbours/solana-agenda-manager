import bs58 from 'bs58';
import * as web3 from '@solana/web3.js';
import {PROGRAM_ID} from '../constants';
import {Agenda} from '../models/Agenda';

export class AgendaCoordinator {
  static accounts: web3.PublicKey[] = [];

  static async prefetchAccounts(connection: web3.Connection) {
    const accounts = await connection.getProgramAccounts(
      new web3.PublicKey(PROGRAM_ID),
      {
        dataSlice: {offset: 0, length: 0},
        filters: [
          {
            // memcmp stand for memory comparison => https://solanacookbook.com/guides/get-program-accounts.html#filters
            // here we are filtering by returning only the accounts wiht our "agenda" discriminator
            memcmp: {
              offset: 4,
              bytes: bs58.encode(Buffer.from('agenda')),
            },
          },
        ],
      },
    );

    this.accounts = accounts.map(account => account.pubkey);
  }

  static async fetchPage(
    connection: web3.Connection,
    page: number,
    perPage: number,
    search: string,
    reload: boolean = false,
  ) {
    if (this.accounts.length === 0 || reload) {
      await this.prefetchAccounts(connection);
    }

    const paginatedPublicKeys = this.accounts.slice(
      (page - 1) * perPage,
      page * perPage,
    );

    if (paginatedPublicKeys.length === 0) {
      return [];
    }

    const accounts = await connection.getMultipleAccountsInfo(
      paginatedPublicKeys,
    );

    const agendas = accounts.reduce((acc: Agenda[], account) => {
      const agenda = Agenda.deserialize(account?.data);
      if (!agenda) {
        return acc;
      }

      return [...acc, agenda];
    }, []);

    return agendas;
  }
}
