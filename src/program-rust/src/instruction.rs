use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{msg, program_error::ProgramError, pubkey::Pubkey};

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct AgendaPayload {
    id: u64,
    name: String,
}

#[derive(BorshDeserialize)]
pub struct EventPayload {
    pub start_time: u64,
    pub end_time: u64,
}

pub enum AgendaEventInstruction {
    CreateAgenda { id: u64, name: String },
    UpdateAgenda { id: u64, name: String },
    DeleteAgenda { id: u64 },
    AddEvent { start_time: u64, end_time: u64 },
}

impl AgendaEventInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        // Take the first byte as the variant to

        // determine which instruction to execute

        // msg!("Input {:?}", input);
        let (&variant, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;

        // Use the temporary payload struct to deserialize

        // msg!("Variant {}", &variant);
        // let payload = ScheduleInstructionPayload::try_from_slice(input).unwrap();

        // Match the variant to determine which data struct is expected by
        // msg!("Payload {}", payload.start_time);

        // the function and return the TestStruct or an error
        Ok(match variant {
            0 => {
                let payload = AgendaPayload::try_from_slice(rest).unwrap();
                Self::CreateAgenda {
                    id: payload.id,
                    name: payload.name,
                }
            }
            1 => {
                let payload = AgendaPayload::try_from_slice(rest).unwrap();
                Self::UpdateAgenda {
                    id: payload.id,
                    name: payload.name,
                }
            }
            2 => {
                let payload = AgendaPayload::try_from_slice(rest).unwrap();
                Self::DeleteAgenda { id: payload.id }
            }
            3 => {
                let payload = EventPayload::try_from_slice(rest).unwrap();
                Self::AddEvent {
                    start_time: payload.start_time,
                    end_time: payload.end_time,
                }
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
}
