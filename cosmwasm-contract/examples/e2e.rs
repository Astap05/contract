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
    let mut app: App = AppBuilder::new().build(|_router, _api, _storage| {});

    let denom = "utoken".to_string();
    let total_tokens: u128 = 100;

    let issuer: Addr = app.api().addr_make("issuer");
    let participant: Addr = app.api().addr_make("participant");

    app.sudo(SudoMsg::Bank(BankSudo::Mint {
        to_address: issuer.to_string(),
        amount: coins(1_000_000_000u128, denom.clone()),
    }))
    .unwrap();

    app.sudo(SudoMsg::Bank(BankSudo::Mint {
        to_address: participant.to_string(),
        amount: coins(1_000_000_000u128, denom.clone()),
    }))
    .unwrap();

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
            "token-distribution",
            None,
        )
        .unwrap();

    println!("Contract instantiated at: {}", contract_addr);

    // deposit: пополняем контракт на 100 utoken (в тесте просто mint на адрес контракта)
    app.sudo(SudoMsg::Bank(BankSudo::Mint {
        to_address: contract_addr.to_string(),
        amount: vec![Coin {
            denom: denom.clone(),
            amount: Uint128::from(total_tokens as u128).into(),
        }],
    }))
    .unwrap();

    app.execute_contract(
        participant.clone(),
        contract_addr.clone(),
        &ExecuteMsg::RegisterParticipant {},
        &[],
    )
    .unwrap();

    app.execute_contract(
        participant.clone(),
        contract_addr.clone(),
        &ExecuteMsg::SubmitTask {
            description: Some("Тестовое задание".to_string()),
        },
        &[],
    )
    .unwrap();

    app.execute_contract(
        issuer.clone(),
        contract_addr.clone(),
        &ExecuteMsg::ValidateTask {
            participant: participant.to_string(),
        },
        &[],
    )
    .unwrap();

    app.execute_contract(
        participant.clone(),
        contract_addr.clone(),
        &ExecuteMsg::ClaimReward {},
        &[],
    )
    .unwrap();

    let balance = app.wrap().query_balance(participant.to_string(), denom.clone()).unwrap();
    println!("Participant balance: {} {}", balance.amount, balance.denom);

    let stats: cosmwasm_contract::msg::StatsResponse = app
        .wrap()
        .query_wasm_smart(contract_addr.clone(), &QueryMsg::GetStats {})
        .unwrap();
    println!(
        "Stats → total: {}, distributed: {}, remaining: {}",
        stats.total_tokens, stats.tokens_distributed, stats.tokens_remaining
    );

    assert_eq!(stats.tokens_distributed, 1u128);
    assert_eq!(stats.total_tokens - stats.tokens_distributed, stats.tokens_remaining);

    println!("\nSUCCESS: full flow passed in cw-multi-test example.\n");
}


