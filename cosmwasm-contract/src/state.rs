use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

/// Конфигурация контракта - хранит информацию об эмиссионном кошельке
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Config {
    /// Адрес держателя эмиссионного кошелька (кто может валидировать задания)
    pub issuer: Addr,
    /// Общее количество токенов для распределения
    pub total_tokens: u128,
    /// Деноминация токена (например, "uatom", "uosmo")
    pub denom: String,
}

/// Состояние участника в системе
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub enum ParticipantStatus {
    /// Зарегистрирован, но задание не подано
    Registered,
    /// Задание подано и ожидает валидации
    TaskSubmitted,
    /// Задание валидировано держателем эмиссии, токен может быть получен
    Validated,
    /// Токен уже получен
    TokenClaimed,
}

/// Информация о задании участника
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct TaskInfo {
    /// Адрес участника
    pub participant: Addr,
    /// Описание задания (может быть пустым, если задание описано вне блокчейна)
    pub description: Option<String>,
    /// Время подачи задания
    pub submitted_at: u64,
    /// Валидировано ли задание
    pub validated: bool,
    /// Время валидации (если валидировано)
    pub validated_at: Option<u64>,
    /// Получен ли токен
    pub token_claimed: bool,
}

// Хранилище конфигурации контракта
pub const CONFIG: Item<Config> = Item::new("config");

// Мапа участников: адрес -> статус
pub const PARTICIPANTS: Map<&Addr, ParticipantStatus> = Map::new("participants");

// Мапа заданий: адрес -> информация о задании
pub const TASKS: Map<&Addr, TaskInfo> = Map::new("tasks");

// Счетчик выданных токенов
pub const TOKENS_DISTRIBUTED: Item<u128> = Item::new("tokens_distributed");
