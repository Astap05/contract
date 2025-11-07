use std::env;

use cosmwasm_std::{coins, Addr, Coin, Uint128};
use cw_multi_test::{App, AppBuilder, BankSudo, Contract, ContractWrapper, Executor, SudoMsg};

use cosmwasm_contract::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};

fn contract() -> Box<dyn Contract<cosmwasm_std::Empty>> {
    Box::new(ContractWrapper::new(
        cosmwasm_contract::contract::execute,
        cosmwasm_contract::contract::instantiate,
        cosmwasm_contract::contract::query,
    ))
}

fn env_u32(key: &str, default: u32) -> u32 {
    env::var(key)
        .ok()
        .and_then(|v| v.parse::<u32>().ok())
        .unwrap_or(default)
}

fn env_string(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

fn main() {
    // Параметры прототипа через ENV (опционально)
    // PARTICIPANTS (u32), TOTAL_TOKENS (u32), DENOM (string)
    let participants = env_u32("PARTICIPANTS", 10);
    let total_tokens = env_u32("TOTAL_TOKENS", participants) as u128;
    let denom = env_string("DENOM", "utoken");

    let mut app: App = AppBuilder::new().build(|_router, _api, _storage| {});

    let issuer: Addr = app.api().addr_make("issuer");

    // газ
    app.sudo(SudoMsg::Bank(BankSudo::Mint {
        to_address: issuer.to_string(),
        amount: coins(1_000_000_000u128, denom.clone()),
    }))
    .unwrap();

    // деплой
    let code_id = app.store_code(contract());
    let instantiate_msg = InstantiateMsg {
        issuer: issuer.to_string(),
        total_tokens,
        denom: denom.clone(),
    };
    let contract_addr = app
        .instantiate_contract(code_id, issuer.clone(), &instantiate_msg, &[], "prototype", None)
        .unwrap();

    // пополнение контракта на total_tokens
    app.sudo(SudoMsg::Bank(BankSudo::Mint {
        to_address: contract_addr.to_string(),
        amount: vec![Coin {
            denom: denom.clone(),
            amount: Uint128::from(total_tokens).into(),
        }],
    }))
    .unwrap();

    // основной цикл
    for i in 0..participants {
        let p: Addr = app.api().addr_make(&format!("p{}", i + 1));

        // немного газа участнику
        app.sudo(SudoMsg::Bank(BankSudo::Mint {
            to_address: p.to_string(),
            amount: coins(10_000_000u128, denom.clone()),
        }))
        .unwrap();

        println!("\n[{}/{}] Участник: {}", i + 1, participants, p);

        // Текущий баланс контракта перед действием
        let c_before = app
            .wrap()
            .query_balance(contract_addr.to_string(), denom.clone())
            .unwrap()
            .amount;

        // Регистрация
        app.execute_contract(
            p.clone(),
            contract_addr.clone(),
            &ExecuteMsg::RegisterParticipant {},
            &[],
        )
        .unwrap();
        println!("  - Зарегистрирован");

        // Подача задания
        app.execute_contract(
            p.clone(),
            contract_addr.clone(),
            &ExecuteMsg::SubmitTask {
                description: Some(format!("task #{i}")),
            },
            &[],
        )
        .unwrap();
        println!("  - Отправил задание: task #{}", i);

        // Валидация (issuer)
        app.execute_contract(
            issuer.clone(),
            contract_addr.clone(),
            &ExecuteMsg::ValidateTask {
                participant: p.to_string(),
            },
            &[],
        )
        .unwrap();
        println!("  - Задание валидировано держателем эмиссии (issuer)");

        // Получение награды
        app.execute_contract(
            p.clone(),
            contract_addr.clone(),
            &ExecuteMsg::ClaimReward {},
            &[],
        )
        .unwrap();

        // Балансы после
        let c_after = app
            .wrap()
            .query_balance(contract_addr.to_string(), denom.clone())
            .unwrap()
            .amount;
        let p_after = app
            .wrap()
            .query_balance(p.to_string(), denom.clone())
            .unwrap()
            .amount;

        println!(
            "  - Выплата: 1 {} отправлено ОТ контракта {} К {}",
            denom, contract_addr, p
        );
        println!(
            "    Баланс контракта: {} -> {} (−1)",
            c_before, c_after
        );
        println!("    Баланс участника {}: {}", p, p_after);
    }

    // сводка
    let stats: cosmwasm_contract::msg::StatsResponse = app
        .wrap()
        .query_wasm_smart(contract_addr.clone(), &QueryMsg::GetStats {})
        .unwrap();
    println!(
        "Done. total={}, distributed={}, remaining={}",
        stats.total_tokens, stats.tokens_distributed, stats.tokens_remaining
    );
}


