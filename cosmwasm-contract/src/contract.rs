#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, BankMsg, Binary, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Response,
    StdResult, Uint256,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{
    ConfigResponse, ExecuteMsg, InstantiateMsg, ParticipantInfo, ParticipantStatusResponse, QueryMsg,
    StatsResponse, TaskInfoResponse, ParticipantsListResponse,
};
use crate::state::{
    Config, ParticipantStatus, CONFIG, PARTICIPANTS, TASKS, TaskInfo, TOKENS_DISTRIBUTED,
};
use cw_storage_plus::Bound;

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:token-distribution";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let issuer = deps.api.addr_validate(&msg.issuer)?;

    let config = Config {
        issuer: issuer.clone(),
        total_tokens: msg.total_tokens,
        denom: msg.denom.clone(),
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &config)?;
    TOKENS_DISTRIBUTED.save(deps.storage, &0u128)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("issuer", issuer)
        .add_attribute("total_tokens", msg.total_tokens.to_string())
        .add_attribute("denom", msg.denom))
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
        ExecuteMsg::ValidateTask { participant } => execute::validate_task(deps, env, info, participant),
        ExecuteMsg::ClaimReward {} => execute::claim_reward(deps, env, info),
        ExecuteMsg::Deposit {} => execute::deposit(deps, info),
    }
}

pub mod execute {
    use super::*;

    /// Регистрация участника в системе
    pub fn register_participant(
        deps: DepsMut,
        info: MessageInfo,
    ) -> Result<Response, ContractError> {
        // Проверяем, не зарегистрирован ли уже участник
        if PARTICIPANTS.may_load(deps.storage, &info.sender)?.is_some() {
            return Err(ContractError::AlreadyRegistered {});
        }

        // Регистрируем участника со статусом Registered
        PARTICIPANTS.save(
            deps.storage,
            &info.sender,
            &ParticipantStatus::Registered,
        )?;

        Ok(Response::new()
            .add_attribute("action", "register_participant")
            .add_attribute("participant", info.sender))
    }

    /// Подача задания участником
    pub fn submit_task(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        description: Option<String>,
    ) -> Result<Response, ContractError> {
        // Проверяем, что участник зарегистрирован
        let status = PARTICIPANTS
            .load(deps.storage, &info.sender)
            .map_err(|_| ContractError::NotRegistered {})?;

        // Проверяем, что задание еще не подано
        if let Some(task) = TASKS.may_load(deps.storage, &info.sender)? {
            if task.validated && !task.token_claimed {
                // Задание уже валидировано, но токен не получен
                return Err(ContractError::TaskAlreadyValidated {});
            }
            if task.token_claimed {
                // Токен уже получен
                return Err(ContractError::TokenAlreadyClaimed {});
            }
            return Err(ContractError::TaskAlreadySubmitted {});
        }

        // Создаем новое задание
        let task_info = TaskInfo {
            participant: info.sender.clone(),
            description,
            submitted_at: env.block.time.seconds(),
            validated: false,
            validated_at: None,
            token_claimed: false,
        };

        TASKS.save(deps.storage, &info.sender, &task_info)?;

        // Обновляем статус участника
        PARTICIPANTS.save(
            deps.storage,
            &info.sender,
            &ParticipantStatus::TaskSubmitted,
        )?;

        Ok(Response::new()
            .add_attribute("action", "submit_task")
            .add_attribute("participant", info.sender))
    }

    /// Валидация задания держателем эмиссионного кошелька
    pub fn validate_task(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        participant: String,
    ) -> Result<Response, ContractError> {
        let config = CONFIG.load(deps.storage)?;

        // Проверяем, что вызывающий является issuer
        if info.sender != config.issuer {
            return Err(ContractError::OnlyIssuer {});
        }

        let participant_addr = deps.api.addr_validate(&participant)?;

        // Проверяем, что задание существует
        let mut task = TASKS
            .load(deps.storage, &participant_addr)
            .map_err(|_| ContractError::TaskNotSubmitted {})?;

        // Проверяем, что задание еще не валидировано
        if task.validated {
            return Err(ContractError::TaskAlreadyValidated {});
        }

        // Помечаем задание как валидированное
        task.validated = true;
        task.validated_at = Some(env.block.time.seconds());

        TASKS.save(deps.storage, &participant_addr, &task)?;

        // Обновляем статус участника
        PARTICIPANTS.save(
            deps.storage,
            &participant_addr,
            &ParticipantStatus::Validated,
        )?;

        Ok(Response::new()
            .add_attribute("action", "validate_task")
            .add_attribute("participant", participant)
            .add_attribute("validated_at", env.block.time.seconds().to_string()))
    }

    /// Получение токена участником после валидации
    /// Токены должны быть на балансе контракта (issuer должен предварительно отправить их)
    pub fn claim_reward(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
    ) -> Result<Response, ContractError> {
        let config = CONFIG.load(deps.storage)?;

        // Проверяем, что задание существует и валидировано
        let mut task = TASKS
            .load(deps.storage, &info.sender)
            .map_err(|_| ContractError::TaskNotSubmitted {})?;

        if !task.validated {
            return Err(ContractError::TaskNotValidated {});
        }

        if task.token_claimed {
            return Err(ContractError::TokenAlreadyClaimed {});
        }

        // Проверяем, что еще есть токены для распределения
        let tokens_distributed = TOKENS_DISTRIBUTED.load(deps.storage)?;
        if tokens_distributed >= config.total_tokens {
            return Err(ContractError::AllTokensDistributed {});
        }

        // Проверяем баланс контракта на наличие достаточного количества токенов
        let contract_balance = deps.querier.query_balance(
            &env.contract.address,
            config.denom.clone(),
        )?;

        if contract_balance.amount < Uint256::from(1u128) {
            return Err(ContractError::NoTokensRemaining {});
        }

        // Помечаем токен как полученный
        task.token_claimed = true;
        TASKS.save(deps.storage, &info.sender, &task)?;

        // Обновляем счетчик выданных токенов
        let new_distributed = tokens_distributed + 1;
        TOKENS_DISTRIBUTED.save(deps.storage, &new_distributed)?;

        // Обновляем статус участника
        PARTICIPANTS.save(
            deps.storage,
            &info.sender,
            &ParticipantStatus::TokenClaimed,
        )?;

        // Создаем сообщение для отправки токена участнику
        // Токены будут отправлены с баланса контракта
        let bank_msg = CosmosMsg::Bank(BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: vec![cosmwasm_std::Coin {
                denom: config.denom.clone(),
                amount: Uint256::from(1u128),
            }],
        });

        Ok(Response::new()
            .add_message(bank_msg)
            .add_attribute("action", "claim_reward")
            .add_attribute("participant", info.sender)
            .add_attribute("tokens_claimed", "1")
            .add_attribute("tokens_distributed", new_distributed.to_string()))
    }

    /// Пополнение баланса контракта токенами
    /// Issuer отправляет токены вместе с вызовом этой функции
    pub fn deposit(
        deps: DepsMut,
        info: MessageInfo,
    ) -> Result<Response, ContractError> {
        let config = CONFIG.load(deps.storage)?;

        // Проверяем, что вызывающий является issuer
        if info.sender != config.issuer {
            return Err(ContractError::OnlyIssuer {});
        }

        // Проверяем, что в транзакции есть токены
        if info.funds.is_empty() {
            return Err(ContractError::Std(cosmwasm_std::StdError::msg(
                "No funds sent",
            )));
        }

        // Находим токены нужной деноминации
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
            .add_attribute("issuer", info.sender)
            .add_attribute("amount", deposit_amount.to_string())
            .add_attribute("denom", config.denom))
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
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
        QueryMsg::GetStats {} => to_json_binary(&query::get_stats(deps)?),
    }
}

pub mod query {
    use super::*;
    use crate::msg::{ConfigResponse, ParticipantStatusResponse};

    pub fn get_config(deps: Deps) -> StdResult<ConfigResponse> {
        let config = CONFIG.load(deps.storage)?;
        let tokens_distributed = TOKENS_DISTRIBUTED.load(deps.storage)?;
        let tokens_remaining = config.total_tokens.saturating_sub(tokens_distributed);

        Ok(ConfigResponse {
            issuer: config.issuer,
            total_tokens: config.total_tokens,
            denom: config.denom,
            tokens_distributed,
            tokens_remaining,
        })
    }

    pub fn get_participant_status(
        deps: Deps,
        participant: String,
    ) -> StdResult<ParticipantStatusResponse> {
        let participant_addr = deps.api.addr_validate(&participant)?;

        let status = PARTICIPANTS.may_load(deps.storage, &participant_addr)?;
        let task = TASKS.may_load(deps.storage, &participant_addr)?;

        let (status_str, has_task, task_validated, token_claimed) = match (status, task) {
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
            ),
            (Some(status), None) => (
                match status {
                    ParticipantStatus::Registered => "registered".to_string(),
                    _ => "unknown".to_string(),
                },
                false,
                false,
                false,
            ),
            _ => ("not_registered".to_string(), false, false, false),
        };

        Ok(ParticipantStatusResponse {
            participant: participant_addr,
            status: status_str,
            has_task,
            task_validated,
            token_claimed,
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
            .range(deps.storage, start_bound, None, cosmwasm_std::Order::Ascending)
            .take(limit)
            .map(|item| {
                let (addr, status) = item?;
                let task = TASKS.may_load(deps.storage, &addr)?;

                let (status_str, has_task, task_validated, token_claimed) = match task {
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
                    ),
                    None => (
                        match status {
                            ParticipantStatus::Registered => "registered".to_string(),
                            _ => "unknown".to_string(),
                        },
                        false,
                        false,
                        false,
                    ),
                };

                Ok(ParticipantInfo {
                    address: addr.clone(),
                    status: status_str,
                    has_task,
                    task_validated,
                    token_claimed,
                })
            })
            .collect();

        Ok(ParticipantsListResponse {
            participants: participants?,
        })
    }

    pub fn get_stats(deps: Deps) -> StdResult<StatsResponse> {
        let config = CONFIG.load(deps.storage)?;
        let tokens_distributed = TOKENS_DISTRIBUTED.load(deps.storage)?;
        let tokens_remaining = config.total_tokens.saturating_sub(tokens_distributed);

        let mut total_participants = 0u32;
        let mut registered = 0u32;
        let mut task_submitted = 0u32;
        let mut validated = 0u32;
        let mut tokens_claimed = 0u32;

        for item in PARTICIPANTS.range(deps.storage, None, None, cosmwasm_std::Order::Ascending) {
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
            total_tokens: config.total_tokens,
            tokens_distributed,
            tokens_remaining,
            total_participants,
            registered,
            task_submitted,
            validated,
            tokens_claimed,
        })
    }
}
