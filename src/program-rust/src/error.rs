use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AgendaEventError {
    // Error 0
    #[error("Account not initialized yet")]
    UninitializedAccount,

    // Error 1
    #[error("PDA derived does not equal PDA passed in")]
    InvalidPDA,

    // Error 2
    #[error("Input data exceeds max length")]
    InvalidDataLength,

    // Error 3
    #[error("Invalid start time")]
    InvalidStartTime,

    // Error 4
    #[error("Invalid end time")]
    InvalidEndTime,

    // Error 5
    #[error("Account already initialized")]
    AccountAlreadyInitialized,
}

impl From<AgendaEventError> for ProgramError {
    fn from(e: AgendaEventError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
