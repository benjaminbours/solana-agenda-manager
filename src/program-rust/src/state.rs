use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_pack::{IsInitialized, Sealed},
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct AgendaAccountState {
    pub discriminator: String,
    pub is_initialized: bool,
    pub id: u64,
    pub name: String,
    pub owner: Pubkey,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct AgendaEventCounter {
    pub discriminator: String,
    pub is_initialized: bool,
    pub counter: u64,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct AgendaEvent {
    pub discriminator: String,
    pub is_initialized: bool,
    pub start_time: u64,
    pub end_time: u64,
    pub agenda: Pubkey,
}

impl Sealed for AgendaAccountState {}

impl IsInitialized for AgendaAccountState {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl AgendaAccountState {
    pub const DISCRIMINATOR: &'static str = "agenda";

    pub fn get_account_size(name: String) -> usize {
        // 4 is the size of the bit address or something, check back Solana documentation about it
        (4 + AgendaAccountState::DISCRIMINATOR.len())
        + 1 // is_initialized
        + (4 + name.len())
    }
}

impl IsInitialized for AgendaEventCounter {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl AgendaEventCounter {
    pub const DISCRIMINATOR: &'static str = "counter";
    pub const SIZE: usize = (4 + AgendaEventCounter::DISCRIMINATOR.len()) + 1 + 8;
}

impl IsInitialized for AgendaEvent {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl AgendaEvent {
    pub const DISCRIMINATOR: &'static str = "event";
    pub const SIZE: usize = (4 + AgendaEvent::DISCRIMINATOR.len()) + 1 + 8 + 8 + 32;
}
