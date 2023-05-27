use borsh::BorshSerialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::IsInitialized,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};
use std::convert::TryInto;

use crate::error::AgendaEventError;
use crate::instruction::AgendaEventInstruction;
use crate::state::{AgendaAccountState, AgendaEvent, AgendaEventCounter};

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Call unpack to deserialize instruction_data
    let instruction = AgendaEventInstruction::unpack(instruction_data)?;

    match instruction {
        AgendaEventInstruction::CreateAgenda { name } => {
            // Execute program code to create a Schedule
            create_agenda(program_id, accounts, name)
        }
        AgendaEventInstruction::UpdateAgenda { name } => {
            // Execute program code to update a Schedule
            update_agenda(program_id, accounts, name)
        }
        AgendaEventInstruction::DeleteAgenda { name } => {
            // Execute program code to delete a note
            delete_agenda(program_id, accounts, name)
        }
        AgendaEventInstruction::AddEvent {
            start_time,
            end_time,
        } => create_event(program_id, accounts, start_time, end_time),
    }
}

pub fn create_agenda(program_id: &Pubkey, accounts: &[AccountInfo], name: String) -> ProgramResult {
    msg!("Adding agenda");
    msg!("name: {}", name);

    // Get Account iterator
    let account_info_iter = &mut accounts.iter();
    // Get accounts
    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;
    let pda_counter = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    // Derive PDA and check that it matches client
    let (pda, bump_seed) = Pubkey::find_program_address(
        &[initializer.key.as_ref(), name.as_bytes().as_ref()],
        program_id,
    );

    if pda != *pda_account.key {
        msg!("Invalid seeds for PDA");
        return Err(AgendaEventError::InvalidPDA.into());
    }

    // TODO: Add some business logic validation. Such as:
    // Unique name etc

    // Calculate account size required
    let account_len: usize = 1000;
    if AgendaAccountState::get_account_size(name.clone()) > account_len {
        msg!("Data length is larger than 1000 bytes");
        return Err(AgendaEventError::InvalidDataLength.into());
    }

    // Calculate rent required
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    // Create the account
    invoke_signed(
        &system_instruction::create_account(
            initializer.key,
            pda_account.key,
            rent_lamports,
            account_len.try_into().unwrap(),
            program_id,
        ),
        &[
            initializer.clone(),
            pda_account.clone(),
            system_program.clone(),
        ],
        &[&[
            initializer.key.as_ref(),
            name.as_bytes().as_ref(),
            &[bump_seed],
        ]],
    )?;
    msg!("PDA created: {}", pda);

    msg!("unpacking state account");
    let mut account_data =
        try_from_slice_unchecked::<AgendaAccountState>(&pda_account.data.borrow()).unwrap();
    msg!("borrowed account data");

    msg!("Checking if agenda account is already initialized");
    if account_data.is_initialized() {
        msg!("Account already initialized");
        return Err(AgendaEventError::AccountAlreadyInitialized.into());
    }

    account_data.discriminator = AgendaAccountState::DISCRIMINATOR.to_string();
    account_data.is_initialized = true;
    account_data.name = name;
    account_data.owner = *initializer.key;

    msg!("serializing account");
    account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    // msg!("create event counter");
    // let rent = Rent::get()?;
    // let counter_rent_lamports = rent.minimum_balance(AgendaEvent::SIZE);

    // let (counter, counter_bump) =
    //     Pubkey::find_program_address(&[pda.as_ref(), "event".as_ref()], program_id);

    // if counter != *pda_counter.key {
    //     msg!("Invalid seeds for PDA");
    //     return Err(ProgramError::InvalidArgument);
    // }

    // invoke_signed(
    //     &system_instruction::create_account(
    //         initializer.key,
    //         pda_counter.key,
    //         counter_rent_lamports,
    //         AgendaEventCounter::SIZE.try_into().unwrap(),
    //         program_id,
    //     ),
    //     &[
    //         initializer.clone(),
    //         pda_counter.clone(),
    //         system_program.clone(),
    //     ],
    //     &[&[pda.as_ref(), "event".as_ref(), &[counter_bump]]],
    // )?;
    // msg!("event counter created");

    // let mut counter_data =
    //     try_from_slice_unchecked::<AgendaEventCounter>(&pda_counter.data.borrow()).unwrap();

    // msg!("Checking if counter account is already initialized");
    // if counter_data.is_initialized() {
    //     msg!("Account already initialized");
    //     return Err(AgendaEventError::AccountAlreadyInitialized.into());
    // }

    // counter_data.discriminator = AgendaEventCounter::DISCRIMINATOR.to_string();
    // counter_data.counter = 0;
    // counter_data.is_initialized = true;

    // msg!("comment count: {}", counter_data.counter);
    // counter_data.serialize(&mut &mut pda_counter.data.borrow_mut()[..])?;

    Ok(())
}

pub fn update_agenda(program_id: &Pubkey, accounts: &[AccountInfo], name: String) -> ProgramResult {
    msg!("Updating agenda");

    // Get Account iterator
    let account_info_iter = &mut accounts.iter();

    // Get accounts
    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;

    if pda_account.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }

    if !initializer.is_signer {
        msg!("Missing required signature");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Calculate account size required
    let account_len: usize = 1000;
    if AgendaAccountState::get_account_size(name.clone()) > account_len {
        msg!("Data length is larger than 1000 bytes");
        return Err(AgendaEventError::InvalidDataLength.into());
    }

    // Derive PDA and check that it matches client
    let (pda, _bump_seed) = Pubkey::find_program_address(
        &[initializer.key.as_ref(), &name.as_bytes().as_ref()],
        program_id,
    );

    if pda != *pda_account.key {
        msg!("Invalid seeds for PDA");
        return Err(AgendaEventError::InvalidPDA.into());
    }

    msg!("unpacking state account");
    let mut account_data =
        try_from_slice_unchecked::<AgendaAccountState>(&pda_account.data.borrow()).unwrap();
    msg!("borrowed account data");

    if !account_data.is_initialized() {
        msg!("Account is not initialized");
        return Err(AgendaEventError::UninitializedAccount.into());
    }

    // TODO: Add some business logic validation. Such as:
    // - Not allowing overlap for a same time and entity
    // - Not allowing an end date lower than the start date, and opposite
    // - etc

    msg!("Agenda before update:");
    msg!("Name: {}", account_data.name);
    msg!("Owner: {}", account_data.owner);

    account_data.name = name;
    account_data.owner = *initializer.key;

    msg!("Agenda after update:");
    msg!("Name: {}", account_data.name);
    msg!("Owner: {}", account_data.owner);

    msg!("serializing account");
    account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    msg!("start account serialized");

    Ok(())
}

pub fn delete_agenda(program_id: &Pubkey, accounts: &[AccountInfo], name: String) -> ProgramResult {
    msg!("Deleting schedule");
    msg!("name: {}", name);
    Ok(())
}

pub fn create_event(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    start_time: u64,
    end_time: u64,
) -> ProgramResult {
    msg!("Adding Event...");
    msg!("Start time: {}", start_time);
    msg!("End time: {}", end_time);

    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let pda_agenda = next_account_info(account_info_iter)?;
    let pda_counter = next_account_info(account_info_iter)?;
    let pda_event = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    let mut counter_data =
        try_from_slice_unchecked::<AgendaEventCounter>(&pda_counter.data.borrow()).unwrap();

    let account_len = AgendaEvent::SIZE;

    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    let (pda, bump_seed) = Pubkey::find_program_address(
        &[
            pda_agenda.key.as_ref(),
            counter_data.counter.to_be_bytes().as_ref(),
        ],
        program_id,
    );

    if pda != *pda_event.key {
        msg!("Invalid seeds for PDA");
        return Err(AgendaEventError::InvalidPDA.into());
    }

    invoke_signed(
        &system_instruction::create_account(
            initializer.key,
            pda_event.key,
            rent_lamports,
            account_len.try_into().unwrap(),
            program_id,
        ),
        &[
            initializer.clone(),
            pda_event.clone(),
            system_program.clone(),
        ],
        &[&[
            pda_agenda.key.as_ref(),
            counter_data.counter.to_be_bytes().as_ref(),
            &[bump_seed],
        ]],
    )?;

    msg!("Created Event Account");

    let mut event_data = try_from_slice_unchecked::<AgendaEvent>(&pda_event.data.borrow()).unwrap();

    msg!("checking if event account is already initialized");
    if event_data.is_initialized() {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    event_data.discriminator = AgendaEvent::DISCRIMINATOR.to_string();
    event_data.is_initialized = true;
    event_data.start_time = start_time;
    event_data.end_time = end_time;
    event_data.agenda = *pda_agenda.key;

    event_data.serialize(&mut &mut pda_event.data.borrow_mut()[..])?;

    msg!("Event Count: {}", counter_data.counter);

    counter_data.counter += 1;

    counter_data.serialize(&mut &mut pda_counter.data.borrow_mut()[..])?;

    Ok(())
}
