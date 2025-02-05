use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Unknown reply id: {id}")]
    UnknownReplyId { id: u64 },

    #[error("No wasm event found in reply")]
    NoWasmEvent {},

    #[error("No contract address found in reply attributes")]
    NoContractAddress {},

    #[error("Collection not found: {addr}")]
    CollectionNotFound { addr: String },

    #[error("Failed to instantiate CW721 contract")]
    InstantiateFailed {},
}