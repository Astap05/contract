#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Order,
    Response, StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{
    ConfigResponse, ExecuteMsg, InstantiateMsg, ParticipantInfo, ParticipantStatusResponse, QueryMsg,
    StatsResponse, TaskInfoResponse, ParticipantsListResponse,
};
use crate::state::{
    Config, ParticipantStatus, CONFIG, PARTICIPANTS, TASKS, TaskInfo, TOKENS_DISTRIBUTED,
    TOKENS_RESERVED,
};
use cw_storage_plus::Bound;

const CONTRACT_NAME: &str = "crates.io:token-distribution";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let admin = info.sender;
    let treasury = deps.api.addr_validate(&msg.treasury)?;
    let max_participants = msg.max_participants.unwrap_or(100).clamp(1, 100);

    let config = Config {
        admin: admin.clone(),
        treasury: treasury.clone(),
        denom: msg.denom.clone(),
        participant_count: 0,
        max_participants,
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &config)?;
    TOKENS_DISTRIBUTED.save(deps.storage, &Uint128::zero())?;
    TOKENS_RESERVED.save(deps.storage, &Uint128::zero())?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", admin)
        .add_attribute("treasury", treasury)
        .add_attribute("denom", msg.denom)
        .add_attribute("max_participants", max_participants.to_string()))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::RegisterParticipant {} => execute::register_participant(deps, info),
        ExecuteMsg::SubmitTask { description } => execute::submit_task(deps, env, info, description),
        ExecuteMsg::ValidateTask { participant } => {
            execute::validate_task(deps, env, info, participant)
        }
        ExecuteMsg::ApproveDistribution { participant, amount } => {
            execute::approve_distribution(deps, env, info, participant, amount)
        }
        ExecuteMsg::ClaimReward {} => execute::claim_reward(deps, env, info),
        ExecuteMsg::Deposit {} => execute::deposit(deps, info),
    }
}

pub mod execute {
    use super::*;

    pub fn register_participant(deps: DepsMut, info: MessageInfo) -> Result<Response, ContractError> {
        let mut config = CONFIG.load(deps.storage)?;

        if PARTICIPANTS.may_load(deps.storage, &info.sender)?.is_some() {
            return Err(ContractError::AlreadyRegistered {});
        }

        if config.participant_count >= config.max_participants {
            return Err(ContractError::ParticipantLimitReached {});
        }

        PARTICIPANTS.save(
            deps.storage,
            &info.sender,
            &ParticipantStatus::Registered,
        )?;

        config.participant_count += 1;
        CONFIG.save(deps.storage, &config)?;

        Ok(Response::new()
            .add_attribute("action", "register_participant")
            .add_attribute("participant", info.sender))
    }

    pub fn submit_task(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        description: Option<String>,
    ) -> Result<Response, ContractError> {
        PARTICIPANTS
            .load(deps.storage, &info.sender)
            .map_err(|_| ContractError::NotRegistered {})?;

        if TASKS.may_load(deps.storage, &info.sender)?.is_some() {
            return Err(ContractError::TaskAlreadySubmitted {});
        }

        let task_info = TaskInfo {
            participant: info.sender.clone(),
            description,
            submitted_at: env.block.time.seconds(),
            validated: false,
            validated_at: None,
            approved_amount: Uint128::zero(),
            token_claimed: false,
        };

        TASKS.save(deps.storage, &info.sender, &task_info)?;
        PARTICIPANTS.save(
            deps.storage,
            &info.sender,
            &ParticipantStatus::TaskSubmitted,
        )?;

        Ok(Response::new()
            .add_attribute("action", "submit_task")
            .add_attribute("participant", info.sender))
    }

    pub fn validate_task(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        participant: String,
    ) -> Result<Response, ContractError> {
        let config = CONFIG.load(deps.storage)?;
        if info.sender != config.admin {
            return Err(ContractError::OnlyAdmin {});
        }

        let participant_addr = deps.api.addr_validate(&participant)?;
        let mut task = TASKS
            .load(deps.storage, &participant_addr)
            .map_err(|_| ContractError::TaskNotSubmitted {})?;

        if task.validated {
            return Err(ContractError::TaskAlreadyValidated {});
        }

        task.validated = true;
        task.validated_at = Some(env.block.time.seconds());
        TASKS.save(deps.storage, &participant_addr, &task)?;
        PARTICIPANTS.save(
            deps.storage,
            &participant_addr,
            &ParticipantStatus::Validated,
        )?;

        Ok(Response::new()
            .add_attribute("action", "validate_task")
            .add_attribute("participant", participant))
    }

    pub fn approve_distribution(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        participant: String,
        amount: Uint128,
    ) -> Result<Response, ContractError> {
        if amount.is_zero() {
            return Err(ContractError::InvalidAmount {});
        }

        let config = CONFIG.load(deps.storage)?;
        if info.sender != config.admin {
            return Err(ContractError::OnlyAdmin {});
        }

        let participant_addr = deps.api.addr_validate(&participant)?;
        let mut task = TASKS
            .load(deps.storage, &participant_addr)
            .map_err(|_| ContractError::TaskNotSubmitted {})?;

        if !task.validated {
            return Err(ContractError::TaskNotValidated {});
        }

        let mut reserved = TOKENS_RESERVED.load(deps.storage)?;
        let balance = deps
            .querier
            .query_balance(env.contract.address, config.denom.clone())?
            .amount;

        if balance < reserved + amount {
            return Err(ContractError::InsufficientFunds {});
        }

        task.approved_amount += amount;
        TASKS.save(deps.storage, &participant_addr, &task)?;

        reserved += amount;
        TOKENS_RESERVED.save(deps.storage, &reserved)?;

        Ok(Response::new()
            .add_attribute("action", "approve_distribution")
            .add_attribute("participant", participant_addr.to_string())
            .add_attribute("amount", amount))
    }

    pub fn claim_reward(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
    ) -> Result<Response, ContractError> {
        let config = CONFIG.load(deps.storage)?;
        let mut task = TASKS
            .load(deps.storage, &info.sender)
            .map_err(|_| ContractError::TaskNotSubmitted {})?;

        if task.approved_amount.is_zero() {
            return Err(ContractError::NothingToClaim {});
        }

        let mut reserved = TOKENS_RESERVED.load(deps.storage)?;
        let mut distributed = TOKENS_DISTRIBUTED.load(deps.storage)?;

        let amount = task.approved_amount;
        let bank_msg = CosmosMsg::Bank(BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: vec![Coin {
                denom: config.denom.clone(),
                amount,
            }],
        });

        task.token_claimed = true;
        task.approved_amount = Uint128::zero();
        TASKS.save(deps.storage, &info.sender, &task)?;
        PARTICIPANTS.save(
            deps.storage,
            &info.sender,
            &ParticipantStatus::TokenClaimed,
        )?;

        reserved = reserved.checked_sub(amount)?;
        distributed += amount;

        TOKENS_RESERVED.save(deps.storage, &reserved)?;
        TOKENS_DISTRIBUTED.save(deps.storage, &distributed)?;

        Ok(Response::new()
            .add_message(bank_msg)
            .add_attribute("action", "claim_reward")
            .add_attribute("participant", info.sender)
            .add_attribute("amount", amount))
    }

    pub fn deposit(deps: DepsMut, info: MessageInfo) -> Result<Response, ContractError> {
        let config = CONFIG.load(deps.storage)?;
        if info.sender != config.treasury {
            return Err(ContractError::OnlyTreasury {});
        }

        if info.funds.is_empty() {
            return Err(ContractError::Std(cosmwasm_std::StdError::msg(
                "No funds sent",
            )));
        }

        let deposit_amount = info
            .funds
            .iter()
            .find(|coin| coin.denom == config.denom)
            .map(|coin| coin.amount)
            .ok_or_else(|| {
                ContractError::Std(cosmwasm_std::StdError::msg(format!(
                    "Wrong denom. Expected: {}",
                    config.denom
                )))
            })?;

        Ok(Response::new()
            .add_attribute("action", "deposit")
            .add_attribute("treasury", info.sender)
            .add_attribute("amount", deposit_amount)
            .add_attribute("denom", config.denom))
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetConfig {} => to_json_binary(&query::get_config(deps)?),
        QueryMsg::GetParticipantStatus { participant } => {
            to_json_binary(&query::get_participant_status(deps, participant)?)
        }
        QueryMsg::GetTaskInfo { participant } => {
            to_json_binary(&query::get_task_info(deps, participant)?)
        }
        QueryMsg::ListParticipants { start_after, limit } => {
            to_json_binary(&query::list_participants(deps, start_after, limit)?)
        }
        QueryMsg::GetStats {} => to_json_binary(&query::get_stats(deps, env)?),
    }
}

pub mod query {
    use super::*;

    pub fn get_config(deps: Deps) -> StdResult<ConfigResponse> {
        let config = CONFIG.load(deps.storage)?;
        let tokens_distributed = TOKENS_DISTRIBUTED.load(deps.storage)?;
        let tokens_reserved = TOKENS_RESERVED.load(deps.storage)?;

        Ok(ConfigResponse {
            admin: config.admin,
            treasury: config.treasury,
            denom: config.denom,
            max_participants: config.max_participants,
            participant_count: config.participant_count,
            tokens_distributed,
            tokens_reserved,
        })
    }

    pub fn get_participant_status(
        deps: Deps,
        participant: String,
    ) -> StdResult<ParticipantStatusResponse> {
        let participant_addr = deps.api.addr_validate(&participant)?;

        let status = PARTICIPANTS.may_load(deps.storage, &participant_addr)?;
        let task = TASKS.may_load(deps.storage, &participant_addr)?;

        let (status_str, has_task, task_validated, token_claimed, approved_amount) = match (status, task)
        {
            (Some(status), Some(task)) => (
                match status {
                    ParticipantStatus::Registered => "registered".to_string(),
                    ParticipantStatus::TaskSubmitted => "task_submitted".to_string(),
                    ParticipantStatus::Validated => "validated".to_string(),
                    ParticipantStatus::TokenClaimed => "token_claimed".to_string(),
                },
                true,
                task.validated,
                task.token_claimed,
                task.approved_amount,
            ),
            (Some(status), None) => (
                match status {
                    ParticipantStatus::Registered => "registered".to_string(),
                    _ => "unknown".to_string(),
                },
                false,
                false,
                false,
                Uint128::zero(),
            ),
            _ => ("not_registered".to_string(), false, false, false, Uint128::zero()),
        };

        Ok(ParticipantStatusResponse {
            participant: participant_addr,
            status: status_str,
            has_task,
            task_validated,
            token_claimed,
            approved_amount,
        })
    }

    pub fn get_task_info(deps: Deps, participant: String) -> StdResult<TaskInfoResponse> {
        let participant_addr = deps.api.addr_validate(&participant)?;
        let task = TASKS
            .load(deps.storage, &participant_addr)
            .map_err(|_| cosmwasm_std::StdError::msg("task not found"))?;

        Ok(TaskInfoResponse {
            participant: task.participant,
            description: task.description,
            submitted_at: task.submitted_at,
            validated: task.validated,
            validated_at: task.validated_at,
            approved_amount: task.approved_amount,
            token_claimed: task.token_claimed,
        })
    }

    pub fn list_participants(
        deps: Deps,
        start_after: Option<String>,
        limit: Option<u32>,
    ) -> StdResult<ParticipantsListResponse> {
        let limit = limit.unwrap_or(30).min(100) as usize;

        let start = start_after.map(|s| deps.api.addr_validate(&s)).transpose()?;
        let start_bound = start.as_ref().map(|addr| Bound::exclusive(addr));

        let participants: StdResult<Vec<_>> = PARTICIPANTS
            .range(deps.storage, start_bound, None, Order::Ascending)
            .take(limit)
            .map(|item| {
                let (addr, status) = item?;
                let task = TASKS.may_load(deps.storage, &addr)?;

                let (status_str, has_task, task_validated, token_claimed, approved_amount) =
                    match task {
                        Some(task) => (
                            match status {
                                ParticipantStatus::Registered => "registered".to_string(),
                                ParticipantStatus::TaskSubmitted => "task_submitted".to_string(),
                                ParticipantStatus::Validated => "validated".to_string(),
                                ParticipantStatus::TokenClaimed => "token_claimed".to_string(),
                            },
                            true,
                            task.validated,
                            task.token_claimed,
                            task.approved_amount,
                        ),
                        None => (
                            match status {
                                ParticipantStatus::Registered => "registered".to_string(),
                                _ => "unknown".to_string(),
                            },
                            false,
                            false,
                            false,
                            Uint128::zero(),
                        ),
                    };

                Ok(ParticipantInfo {
                    address: addr.clone(),
                    status: status_str,
                    has_task,
                    task_validated,
                    token_claimed,
                    approved_amount,
                })
            })
            .collect();

        Ok(ParticipantsListResponse {
            participants: participants?,
        })
    }

    pub fn get_stats(deps: Deps, env: Env) -> StdResult<StatsResponse> {
        let config = CONFIG.load(deps.storage)?;
        let tokens_distributed = TOKENS_DISTRIBUTED.load(deps.storage)?;
        let tokens_reserved = TOKENS_RESERVED.load(deps.storage)?;
        let contract_balance = deps
            .querier
            .query_balance(env.contract.address, config.denom.clone())?
            .amount;
        let tokens_available = contract_balance.checked_sub(tokens_reserved)?;

        let mut total_participants = 0u32;
        let mut registered = 0u32;
        let mut task_submitted = 0u32;
        let mut validated = 0u32;
        let mut tokens_claimed = 0u32;

        for item in PARTICIPANTS.range(deps.storage, None, None, Order::Ascending) {
            let (_, status) = item?;
            total_participants += 1;
            match status {
                ParticipantStatus::Registered => registered += 1,
                ParticipantStatus::TaskSubmitted => task_submitted += 1,
                ParticipantStatus::Validated => validated += 1,
                ParticipantStatus::TokenClaimed => tokens_claimed += 1,
            }
        }

        Ok(StatsResponse {
            total_tokens: contract_balance,
            tokens_distributed,
            tokens_reserved,
            tokens_available,
            total_participants,
            registered,
            task_submitted,
            validated,
            tokens_claimed,
        })
    }
}
