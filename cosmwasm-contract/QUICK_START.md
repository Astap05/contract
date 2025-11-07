# Быстрый старт: Тестирование в Testnet

## 📋 Краткая версия (для опытных пользователей)

### 1. Подготовка
- ✅ Установите Keplr Wallet
- ✅ Добавьте Juno Testnet (`uni-6`) в Keplr
- ✅ Получите testnet токены через faucet: https://faucet.uni.juno.deuslabs.fi/

### 2. Сборка контракта
```bash
cd cosmwasm-contract
cargo build --release --target wasm32-unknown-unknown

# Оптимизация (если есть Docker)
docker run --rm -v "${PWD}:/code" \
  --mount type=volume,source="cosmwasm-contract_cache",target=/target \
  cosmwasm/optimizer:0.16.0
```

### 3. Загрузка контракта
- Откройте: https://testnet.juno.deuslabs.fi/
- Подключите Keplr
- Upload Contract → выберите `artifacts/cosmwasm-contract.wasm`
- **Сохраните Code ID**

### 4. Инициализация
**JSON для instantiate:**
```json
{
  "issuer": "ВАШ_АДРЕС_JUNO",
  "total_tokens": "100",
  "denom": "ujunox"
}
```
- Instantiate Contract → вставьте JSON
- **Сохраните Contract Address**

### 5. Пополнение баланса
- Отправьте 100 токенов на Contract Address через Keplr Send
- Или вызовите `deposit` с токенами

### 6. Тестирование функций

#### Регистрация участника:
```json
{"register_participant": {}}
```

#### Подача задания:
```json
{"submit_task": {"description": "Тестовое задание"}}
```

#### Валидация (только issuer):
```json
{"validate_task": {"participant": "АДРЕС_УЧАСТНИКА"}}
```

#### Получение токена:
```json
{"claim_reward": {}}
```

### 7. Проверка
**Query:**
```json
{"get_stats": {}}
```

---

## 📖 Подробная инструкция

Смотрите **TESTNET_GUIDE.md** для полной пошаговой инструкции со скриншотами и объяснениями.

---

## 🔗 Полезные ссылки

- **Juno Testnet Explorer:** https://testnet.juno.deuslabs.fi/
- **Juno Faucet:** https://faucet.uni.juno.deuslabs.fi/
- **Keplr Wallet:** https://www.keplr.app/
- **CosmWasm Docs:** https://docs.cosmwasm.com/

---

## ⚠️ Важные замечания

1. Используйте **testnet токены** - они бесплатны
2. Сохраните **Code ID** и **Contract Address**
3. Для валидации используйте кошелек **issuer**
4. Баланс контракта должен быть пополнен перед `claim_reward`

