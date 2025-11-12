use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Uint128};

/// Сообщение инициализации контракта
#[cw_serde]
pub struct InstantiateMsg {
    /// Адрес казначейства, откуда можно пополнять эмиссию
    pub treasury: String,
    /// Деноминация токена (например, "utoken")
    pub denom: String,
    /// Максимальное число участников (1-100, по умолчанию 100)
    pub max_participants: Option<u32>,
}

/// Сообщения выполнения (execute)
#[cw_serde]
pub enum ExecuteMsg {
    /// Регистрация участника в системе
    /// Может быть вызван любым адресом для регистрации себя
    RegisterParticipant {},

    /// Подача задания участником
    /// Участник сообщает, что выполнил задание
    SubmitTask {
        /// Опциональное описание задания (может быть пустым, если задание описано вне блокчейна)
        description: Option<String>,
    },

    /// Валидация задания держателем эмиссионного кошелька
    /// Только issuer может вызвать эту функцию
    ValidateTask {
        /// Адрес участника, задание которого валидируется
        participant: String,
    },

    /// Одобрение индивидуальной выплаты участнику
    /// Может вызвать только администратор (инициатор контракта)
    ApproveDistribution {
        participant: String,
        amount: Uint128,
    },

    /// Получение токена участником после валидации и одобрения
    ClaimReward {},

    /// Пополнение баланса контракта токенами (только issuer)
    /// Issuer отправляет токены на контракт для последующего распределения
    Deposit {},
}

/// Сообщения запросов (query)
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Получить конфигурацию контракта
    #[returns(ConfigResponse)]
    GetConfig {},

    /// Получить статус участника
    #[returns(ParticipantStatusResponse)]
    GetParticipantStatus {
        /// Адрес участника
        participant: String,
    },

    /// Получить информацию о задании участника
    #[returns(TaskInfoResponse)]
    GetTaskInfo {
        /// Адрес участника
        participant: String,
    },

    /// Получить список всех участников
    #[returns(ParticipantsListResponse)]
    ListParticipants {
        /// Начальный индекс для пагинации (опционально)
        start_after: Option<String>,
        /// Лимит количества результатов
        limit: Option<u32>,
    },

    /// Получить общую статистику
    #[returns(StatsResponse)]
    GetStats {},
}

// ========== Responses ==========

/// Ответ с конфигурацией контракта
#[cw_serde]
pub struct ConfigResponse {
    pub admin: Addr,
    pub treasury: Addr,
    pub denom: String,
    pub max_participants: u32,
    pub participant_count: u32,
    pub tokens_distributed: Uint128,
    pub tokens_reserved: Uint128,
}

/// Ответ со статусом участника
#[cw_serde]
pub struct ParticipantStatusResponse {
    pub participant: Addr,
    pub status: String,
    pub has_task: bool,
    pub task_validated: bool,
    pub token_claimed: bool,
    pub approved_amount: Uint128,
}

/// Ответ с информацией о задании
#[cw_serde]
pub struct TaskInfoResponse {
    pub participant: Addr,
    pub description: Option<String>,
    pub submitted_at: u64,
    pub validated: bool,
    pub validated_at: Option<u64>,
    pub approved_amount: Uint128,
    pub token_claimed: bool,
}

/// Ответ со списком участников
#[cw_serde]
pub struct ParticipantsListResponse {
    pub participants: Vec<ParticipantInfo>,
}

/// Информация об участнике в списке
#[cw_serde]
pub struct ParticipantInfo {
    pub address: Addr,
    pub status: String,
    pub has_task: bool,
    pub task_validated: bool,
    pub token_claimed: bool,
    pub approved_amount: Uint128,
}

/// Ответ со статистикой
#[cw_serde]
pub struct StatsResponse {
    pub total_tokens: Uint128,
    pub tokens_distributed: Uint128,
    pub tokens_reserved: Uint128,
    pub tokens_available: Uint128,
    pub total_participants: u32,
    pub registered: u32,
    pub task_submitted: u32,
    pub validated: u32,
    pub tokens_claimed: u32,
}
