use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Only issuer can perform this action")]
    OnlyIssuer {},

    #[error("Participant already registered")]
    AlreadyRegistered {},

    #[error("Participant not registered")]
    NotRegistered {},

    #[error("Task already submitted")]
    TaskAlreadySubmitted {},

    #[error("Task not submitted")]
    TaskNotSubmitted {},

    #[error("Task already validated")]
    TaskAlreadyValidated {},

    #[error("Task not validated")]
    TaskNotValidated {},

    #[error("Token already claimed")]
    TokenAlreadyClaimed {},

    #[error("No tokens remaining")]
    NoTokensRemaining {},

    #[error("All tokens distributed")]
    AllTokensDistributed {},
}
