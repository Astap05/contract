use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Only admin can perform this action")]
    OnlyAdmin {},

    #[error("Only treasury can deposit tokens")]
    OnlyTreasury {},

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

    #[error("Nothing to claim")]
    NothingToClaim {},

    #[error("Not enough available tokens")]
    InsufficientFunds {},

    #[error("Participant limit reached")]
    ParticipantLimitReached {},

    #[error("Invalid amount")]
    InvalidAmount {},

    #[error("All tokens distributed")]
    AllTokensDistributed {},
}
