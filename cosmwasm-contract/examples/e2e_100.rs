use cosmwasm_std::{coins, Addr, Coin, Uint128};
use cw_multi_test::{App, AppBuilder, BankSudo, Contract, ContractWrapper, Executor, SudoMsg};

use cosmwasm_contract::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};

fn contract() -> Box<dyn Contract<cosmwasm_std::Empty>> {
    let contract = ContractWrapper::new(
        cosmwasm_contract::contract::execute,
        cosmwasm_contract::contract::instantiate,
        cosmwasm_contract::contract::query,
    );
    Box::new(contract)
}

fn main() {
    // 1) Локальная песочница
    let mut app: App = AppBuilder::new().build(|_router, api, _storage| {
        // nothing extra
    });

    let denom = "utoken".to_string();
    let total_tokens: u128 = 100;

    // Адрес эмитента
    let issuer: Addr = app.api().addr_make("issuer");

    // 2) Балансы на газ
    app.sudo(SudoMsg::Bank(BankSudo::Mint {
        to_address: issuer.to_string(),
        amount: coins(1_000_000_000u128, denom.clone()),
    }))
    .unwrap();

    // 3) Деплой контракта
    let code_id = app.store_code(contract());
    let instantiate_msg = InstantiateMsg {
        issuer: issuer.to_string(),
        total_tokens,
        denom: denom.clone(),
    };
    let contract_addr = app
        .instantiate_contract(
            code_id,
            issuer.clone(),
            &instantiate_msg,
            &[],
            "token-distribution-100",
            None,
        )
        .unwrap();
    println!("Contract: {}", contract_addr);

    // 4) Пополняем контракт на 100 токенов
    app.sudo(SudoMsg::Bank(BankSudo::Mint {
        to_address: contract_addr.to_string(),
        amount: vec![Coin {
            denom: denom.clone(),
            amount: Uint128::from(total_tokens).into(),
        }],
    }))
    .unwrap();

    // 5) Генерируем 100 участников и выполняем флоу: register → submit → validate → claim
    let mut participants: Vec<Addr> = Vec::with_capacity(100);
    for i in 0..100u32 {
        let p: Addr = app.api().addr_make(&format!("p{}", i + 1));
        // газ участнику
        app.sudo(SudoMsg::Bank(BankSudo::Mint {
            to_address: p.to_string(),
            amount: coins(10_000_000u128, denom.clone()),
        }))
        .unwrap();

        // регистрация
        app.execute_contract(
            p.clone(),
            contract_addr.clone(),
            &ExecuteMsg::RegisterParticipant {},
            &[],
        )
        .unwrap();

        // подача задания
        app.execute_contract(
            p.clone(),
            contract_addr.clone(),
            &ExecuteMsg::SubmitTask {
                description: Some(format!("task #{}", i + 1)),
            },
            &[],
        )
        .unwrap();

        // валидация (issuer)
        app.execute_contract(
            issuer.clone(),
            contract_addr.clone(),
            &ExecuteMsg::ValidateTask {
                participant: p.to_string(),
            },
            &[],
        )
        .unwrap();

        // получение токена
        app.execute_contract(
            p.clone(),
            contract_addr.clone(),
            &ExecuteMsg::ClaimReward {},
            &[],
        )
        .unwrap();

        participants.push(p);
    }

    // 6) Проверка статистики
    let stats: cosmwasm_contract::msg::StatsResponse = app
        .wrap()
        .query_wasm_smart(contract_addr.clone(), &QueryMsg::GetStats {})
        .unwrap();
    println!(
        "Stats → total: {}, distributed: {}, remaining: {}",
        stats.total_tokens, stats.tokens_distributed, stats.tokens_remaining
    );
    assert_eq!(stats.total_tokens, 100);
    assert_eq!(stats.tokens_distributed, 100);
    assert_eq!(stats.tokens_remaining, 0);

    // 7) Контроль нескольких адресов
    for idx in [0usize, 49, 99] {
        let p = &participants[idx];
        let bal = app.wrap().query_balance(p.to_string(), denom.clone()).unwrap();
        // баланс газ + 1 utoken награды
        println!("{} balance: {} {}", p, bal.amount, bal.denom);
    }

    println!("\nSUCCESS: 100 participants registered and rewarded.\n");
}


