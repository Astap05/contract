use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};

/// Конфигурация контракта
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Config {
    /// Адрес администратора (инициатор контракта)
    pub admin: Addr,
    /// Казначейский адрес, с которого можно пополнять эмиссию
    pub treasury: Addr,
    /// Деном токена (uatom/uosmo/…)
    pub denom: String,
    /// Текущее количество зарегистрированных участников
    pub participant_count: u32,
    /// Максимальное число участников
    pub max_participants: u32,
}

/// Состояние участника
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub enum ParticipantStatus {
    Registered,
    TaskSubmitted,
    Validated,
    TokenClaimed,
}

/// Информация о задании и выплатах участника
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct TaskInfo {
    pub participant: Addr,
    pub description: Option<String>,
    pub submitted_at: u64,
    pub validated: bool,
    pub validated_at: Option<u64>,
    /// Сумма, одобренная администратором, но не выплаченная
    pub approved_amount: Uint128,
    /// Получен ли токен (хотя бы одна выплата)
    pub token_claimed: bool,
}

pub const CONFIG: Item<Config> = Item::new("config");

pub const PARTICIPANTS: Map<&Addr, ParticipantStatus> = Map::new("participants");

pub const TASKS: Map<&Addr, TaskInfo> = Map::new("tasks");

pub const TOKENS_DISTRIBUTED: Item<Uint128> = Item::new("tokens_distributed");

pub const TOKENS_RESERVED: Item<Uint128> = Item::new("tokens_reserved");
