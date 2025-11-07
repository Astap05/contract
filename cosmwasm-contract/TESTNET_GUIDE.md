# Пошаговая инструкция: Тестирование в Testnet

## Подготовка

### Шаг 1: Установка необходимых инструментов

#### 1.1. Установка Rust (если еще не установлен)
```bash
# Проверьте установку
cargo --version

# Если не установлен, скачайте с https://rustup.rs/
```

#### 1.2. Установка wasmd (для работы с CosmWasm)
```bash
# Создайте директорию для бинарников (если нужно)
mkdir -p ~/.local/bin

# Скачайте wasmd для вашей ОС:
# Linux/Mac:
wget https://github.com/CosmWasm/wasmd/releases/latest/download/wasmd-*.tar.gz
tar -xzf wasmd-*.tar.gz
sudo mv wasmd /usr/local/bin/

# Или через cargo (если доступно):
# cargo install wasm-cli
```

#### 1.3. Установка оптимизатора CosmWasm
```bash
# Оптимизатор нужен для уменьшения размера WASM файла
# Используется через Docker
docker pull cosmwasm/optimizer:0.16.0
```

**Альтернатива без Docker:** Используйте оптимизатор через GitHub Actions или пропустите этот шаг для тестирования (может работать без оптимизации).

#### 1.4. Установка Keplr Wallet
1. Откройте Chrome/Edge/Brave браузер
2. Перейдите на https://www.keplr.app/
3. Нажмите "Add to Chrome" для установки расширения
4. Создайте новый кошелек или импортируйте существующий
5. **ВАЖНО:** Сохраните seed-фразу в безопасном месте!

---

## Настройка Testnet сети

### Шаг 2: Подключение Testnet к Keplr

#### 2.1. Добавление тестовых сетей

**Osmosis Testnet:**
1. Откройте Keplr Wallet
2. Нажмите на список сетей вверху (обычно показывает текущую сеть)
3. Прокрутите вниз и нажмите "Add Chain"
4. Вставьте следующие данные:

**Chain ID:** `osmo-test-5`
**RPC URL:** `https://rpc.testnet.osmosis.zone`
**REST URL:** `https://lcd.testnet.osmosis.zone`

**Cosmos Hub Testnet:**
- **Chain ID:** `theta-testnet-001`
- **RPC URL:** `https://rpc.sentry-01.theta-testnet.polypore.xyz`
- **REST URL:** `https://rest.sentry-01.theta-testnet.polypore.xyz`

**Juno Testnet (рекомендуется для CosmWasm):**
- **Chain ID:** `uni-6`
- **RPC URL:** `https://rpc.uni.juno.deuslabs.fi`
- **REST URL:** `https://api.uni.juno.deuslabs.fi`

#### 2.2. Получение тестовых токенов

**Для Juno Testnet:**
1. Переключитесь на сеть `uni-6` в Keplr
2. Откройте faucet: https://faucet.uni.juno.deuslabs.fi/
3. Введите ваш адрес Juno (начинается с `juno1...`)
4. Нажмите "Request Tokens"
5. Подождите несколько минут для получения токенов

**Для Osmosis Testnet:**
1. Переключитесь на сеть `osmo-test-5`
2. Faucet: https://faucet.osmosis.zone/
3. Введите адрес (начинается с `osmo1...`)

**Для Cosmos Hub:**
1. Chain ID: `theta-testnet-001`
2. Faucet: https://faucet.theta-testnet.polypore.xyz/

#### 2.3. Проверка баланса
1. Откройте Keplr Wallet
2. Выберите testnet сеть
3. Убедитесь, что у вас есть токены (минимум 0.1 для транзакций)

---

## Сборка и загрузка контракта

### Шаг 3: Сборка WASM контракта

#### 3.1. Перейдите в директорию проекта
```bash
cd C:\Users\Admin\contract\cosmwasm-contract
```

#### 3.2. Соберите контракт
```bash
# Базовая сборка
cargo build --release --target wasm32-unknown-unknown

# Или используйте alias из .cargo/config.toml
cargo wasm
```

#### 3.3. Оптимизация WASM файла (рекомендуется)
```bash
# Через Docker
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename $(pwd))_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0

# После оптимизации файл будет в:
# artifacts/cosmwasm-contract.wasm
```

**На Windows PowerShell:**
```powershell
docker run --rm -v "${PWD}:/code" `
  --mount type=volume,source="cosmwasm-contract_cache",target=/target `
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry `
  cosmwasm/optimizer:0.16.0
```

#### 3.4. Проверьте размер файла
```bash
# Оптимизированный файл должен быть меньше 500KB
ls -lh artifacts/*.wasm
```

---

## Загрузка контракта в Testnet

### Шаг 4: Загрузка через Keplr

#### 4.1. Откройте Keplr и выберите testnet сеть
1. Откройте Keplr Wallet
2. Выберите testnet сеть (например, `uni-6` для Juno)

#### 4.2. Перейдите в раздел Interact with Contract
1. Некоторые testnet имеют веб-интерфейс:
   - **Juno Testnet:** https://testnet.juno.deuslabs.fi/
   - **Osmosis Testnet:** https://testnet.osmosis.zone/
2. Подключите Keplr к сайту
3. Найдите раздел "Contracts" или "Upload Contract"

#### 4.3. Загрузите WASM файл
1. Нажмите "Upload Contract" или "Store Code"
2. Выберите оптимизированный WASM файл:
   - `artifacts/cosmwasm-contract.wasm`
   - Если не оптимизирован: `target/wasm32-unknown-unknown/release/cosmwasm-contract.wasm`
3. Укажите Label: `token-distribution-v1`
4. Подтвердите транзакцию в Keplr
5. **Сохраните Code ID** - он понадобится для инициализации!

---

## Инициализация контракта

### Шаг 5: Инициализация через Keplr

#### 5.1. Подготовка данных для инициализации

**JSON для instantiate:**
```json
{
  "issuer": "ВАШ_АДРЕС_ISSUER",
  "total_tokens": "100",
  "denom": "ujunox"
}
```

**Важно:** 
- `issuer` - это ваш адрес в Keplr (который будет валидировать задания)
- `denom` - деноминация токена в testnet:
  - Juno: `ujunox`
  - Osmosis: `uosmo`
  - Cosmos: `uatom`

#### 5.2. Получение вашего адреса в Keplr
1. Откройте Keplr
2. Выберите testnet сеть
3. Скопируйте ваш адрес (начинается с `juno1...`, `osmo1...` или `cosmos1...`)

#### 5.3. Инициализация контракта
1. На веб-интерфейсе testnet найдите "Instantiate Contract"
2. Введите Code ID (сохраненный на шаге 4.3)
3. Вставьте JSON для instantiate (из шага 5.1), заменив адрес
4. Укажите Label: `token-distribution`
5. Подтвердите транзакцию в Keplr
6. **Сохраните Contract Address** - это адрес вашего контракта!

---

## Пополнение баланса контракта

### Шаг 6: Отправка токенов на контракт

#### 6.1. Перейдите к взаимодействию с контрактом
1. На веб-интерфейсе найдите "Execute Contract" или "Interact"
2. Вставьте Contract Address (из шага 5.3)

#### 6.2. Вызовите функцию `deposit`
1. Выберите функцию: `deposit`
2. JSON для execute:
```json
{
  "deposit": {}
}
```

3. **ВАЖНО:** При вызове функции также отправьте токены:
   - В поле "Amount" укажите количество (например: `100000000ujunox` для 100 токенов)
   - Или отправьте транзакцию с токенами через Keplr:
     - Откройте Keplr
     - Send/Transfer
     - Адрес получателя: Contract Address (из шага 5.3)
     - Amount: `100000000ujunox` (или другая деноминация)
     - Отправьте токены

**Альтернативный способ:**
1. Сначала отправьте токены на контракт через обычный Transfer в Keplr
2. Затем вызовите `deposit` функцию (она зафиксирует факт пополнения)

---

## Тестирование функций

### Шаг 7: Регистрация участников

#### 7.1. Создайте тестовые кошельки
**Вариант 1: Используйте Keplr**
1. Откройте Keplr
2. Создайте новый аккаунт или импортируйте seed-фразу другого кошелька
3. Это будет тестовый участник

**Вариант 2: Используйте один кошелек**
- Для тестирования можно использовать один кошелек как issuer и participant

#### 7.2. Регистрация участника
1. Подключите Keplr с адресом участника
2. На веб-интерфейсе выберите ваш контракт
3. Выберите функцию: `register_participant`
4. JSON:
```json
{
  "register_participant": {}
}
```
5. Подтвердите транзакцию

#### 7.3. Проверка регистрации
1. Выберите Query: `get_participant_status`
2. JSON:
```json
{
  "get_participant_status": {
    "participant": "АДРЕС_УЧАСТНИКА"
  }
}
```
3. Должен вернуть: `"status": "registered"`

---

### Шаг 8: Подача задания

#### 8.1. Вызов функции `submit_task`
1. Убедитесь, что используете кошелек участника
2. Выберите функцию: `submit_task`
3. JSON:
```json
{
  "submit_task": {
    "description": "Выполнил тестовое задание"
  }
}
```

Или без описания:
```json
{
  "submit_task": {
    "description": null
  }
}
```

4. Подтвердите транзакцию

#### 8.2. Проверка подачи задания
1. Query: `get_task_info`
```json
{
  "get_task_info": {
    "participant": "АДРЕС_УЧАСТНИКА"
  }
}
```
2. Должен вернуть информацию о задании с `validated: false`

---

### Шаг 9: Валидация задания (Issuer)

#### 9.1. Переключитесь на кошелек issuer
1. Откройте Keplr
2. Переключитесь на кошелек issuer (который указан при инициализации)

#### 9.2. Валидация задания
1. Выберите функцию: `validate_task`
2. JSON:
```json
{
  "validate_task": {
    "participant": "АДРЕС_УЧАСТНИКА"
  }
}
```
3. Подтвердите транзакцию

**Важно:** Только issuer может вызвать эту функцию!

#### 9.3. Проверка валидации
1. Query: `get_participant_status`
```json
{
  "get_participant_status": {
    "participant": "АДРЕС_УЧАСТНИКА"
  }
}
```
2. Должен вернуть: `"status": "validated"` и `"task_validated": true`

---

### Шаг 10: Получение токена участником

#### 10.1. Переключитесь на кошелек участника
1. Откройте Keplr
2. Переключитесь на кошелек участника

#### 10.2. Получение токена
1. Выберите функцию: `claim_reward`
2. JSON:
```json
{
  "claim_reward": {}
}
```
3. Подтвердите транзакцию

#### 10.3. Проверка получения токена
1. Проверьте баланс участника в Keplr
2. Должен появиться 1 токен (или увеличиться баланс на 1 токен)
3. Query: `get_stats`
```json
{
  "get_stats": {}
}
```
4. Должен показать `tokens_distributed: 1`

---

## Проверка всех функций

### Шаг 11: Тестирование всех Query функций

#### 11.1. Get Config
```json
{
  "get_config": {}
}
```
**Ожидаемый результат:**
- issuer адрес
- total_tokens: 100
- tokens_distributed: количество выданных токенов
- tokens_remaining: оставшиеся токены

#### 11.2. Get Stats
```json
{
  "get_stats": {}
}
```
**Ожидаемый результат:**
- Общая статистика по контракту
- Количество участников на каждом этапе

#### 11.3. List Participants
```json
{
  "list_participants": {
    "start_after": null,
    "limit": 30
  }
}
```
**Ожидаемый результат:**
- Список всех участников с их статусами

---

## Тестирование сценария с несколькими участниками

### Шаг 12: Полный цикл с 3-5 участниками

#### 12.1. Создайте несколько тестовых кошельков
1. Создайте 3-5 тестовых кошельков в Keplr
2. Получите для них testnet токены (если нужно)

#### 12.2. Выполните полный цикл для каждого:
1. ✅ Регистрация (`register_participant`)
2. ✅ Подача задания (`submit_task`)
3. ✅ Валидация issuer (`validate_task`)
4. ✅ Получение токена (`claim_reward`)

#### 12.3. Проверьте финальную статистику
```json
{
  "get_stats": {}
}
```
Должно показать:
- `tokens_claimed: 3` (если тестировали с 3 участниками)
- `tokens_distributed: 3`
- `tokens_remaining: 97` (если было 100 токенов)

---

## Проверка ошибок и граничных случаев

### Шаг 13: Тестирование ошибок

#### 13.1. Попытка повторной регистрации
- Вызовите `register_participant` дважды
- Должна быть ошибка: `AlreadyRegistered`

#### 13.2. Попытка валидации незарегистрированного участника
- Issuer пытается валидировать несуществующего участника
- Должна быть ошибка: `TaskNotSubmitted`

#### 13.3. Попытка получения токена без валидации
- Участник пытается получить токен до валидации
- Должна быть ошибка: `TaskNotValidated`

#### 13.4. Попытка валидации не issuer
- Другой адрес пытается валидировать задание
- Должна быть ошибка: `OnlyIssuer`

#### 13.5. Попытка повторного получения токена
- Участник пытается получить токен дважды
- Должна быть ошибка: `TokenAlreadyClaimed`

---

## Полезные команды для CLI (опционально)

Если вы хотите использовать CLI вместо веб-интерфейса:

### Настройка wasmd для testnet
```bash
# Установите переменные окружения
export CHAIN_ID="uni-6"  # или другая testnet
export RPC="https://rpc.uni.juno.deuslabs.fi"
export KEY_NAME="test-key"
export KEYRING_BACKEND="test"

# Создайте ключ
wasmd keys add $KEY_NAME --keyring-backend $KEYRING_BACKEND

# Проверьте баланс
wasmd query bank balances $(wasmd keys show $KEY_NAME --keyring-backend $KEYRING_BACKEND -a) --node $RPC
```

### Загрузка контракта через CLI
```bash
# Загрузите WASM
RES=$(wasmd tx wasm store artifacts/cosmwasm-contract.wasm \
  --from $KEY_NAME \
  --chain-id $CHAIN_ID \
  --gas-prices 0.025ujunox \
  --gas auto \
  --gas-adjustment 1.3 \
  --keyring-backend $KEYRING_BACKEND \
  --node $RPC \
  --yes \
  -o json)

# Извлеките CODE_ID
CODE_ID=$(echo $RES | jq -r '.logs[0].events[-1].attributes[0].value')
echo "Code ID: $CODE_ID"
```

### Инициализация через CLI
```bash
INIT='{"issuer":"ВАШ_АДРЕС","total_tokens":"100","denom":"ujunox"}'

wasmd tx wasm instantiate $CODE_ID "$INIT" \
  --from $KEY_NAME \
  --label "token-distribution" \
  --admin $(wasmd keys show $KEY_NAME --keyring-backend $KEYRING_BACKEND -a) \
  --chain-id $CHAIN_ID \
  --gas-prices 0.025ujunox \
  --gas auto \
  --gas-adjustment 1.3 \
  --keyring-backend $KEYRING_BACKEND \
  --node $RPC \
  --yes \
  -o json | jq -r '.logs[0].events[0].attributes[0].value'
```

---

## Чек-лист для тестирования

Используйте этот чек-лист для проверки:

### Подготовка
- [ ] Keplr установлен и настроен
- [ ] Testnet сеть добавлена в Keplr
- [ ] Получены testnet токены (минимум 0.1)
- [ ] Контракт собран и оптимизирован
- [ ] WASM файл загружен в testnet
- [ ] Сохранен Code ID
- [ ] Контракт инициализирован
- [ ] Сохранен Contract Address
- [ ] Баланс контракта пополнен токенами

### Основные функции
- [ ] Участник успешно зарегистрирован
- [ ] Участник успешно подал задание
- [ ] Issuer успешно валидировал задание
- [ ] Участник успешно получил токен
- [ ] Баланс участника увеличился на 1 токен

### Query функции
- [ ] `get_config` возвращает правильные данные
- [ ] `get_participant_status` работает корректно
- [ ] `get_task_info` возвращает информацию о задании
- [ ] `list_participants` показывает всех участников
- [ ] `get_stats` показывает правильную статистику

### Обработка ошибок
- [ ] Повторная регистрация вызывает ошибку
- [ ] Валидация не issuer вызывает ошибку
- [ ] Получение токена без валидации вызывает ошибку
- [ ] Повторное получение токена вызывает ошибку

### Множественные участники
- [ ] 3+ участника успешно зарегистрированы
- [ ] Все задания валидированы
- [ ] Все участники получили токены
- [ ] Статистика показывает правильное количество распределенных токенов

---

## Решение проблем

### Проблема: "Insufficient funds"
**Решение:** Получите больше testnet токенов через faucet

### Проблема: "Unauthorized" при валидации
**Решение:** Убедитесь, что используете правильный кошелек issuer

### Проблема: Контракт не найден
**Решение:** Проверьте, что используете правильный Contract Address

### Проблема: "No tokens remaining"
**Решение:** Убедитесь, что баланс контракта пополнен токенами через `deposit`

### Проблема: Ошибка компиляции
**Решение:** Убедитесь, что все зависимости установлены: `cargo build --release --target wasm32-unknown-unknown`

---

## Дополнительные ресурсы

- **CosmWasm документация:** https://docs.cosmwasm.com/
- **Keplr документация:** https://docs.keplr.app/
- **Juno Testnet:** https://testnet.juno.deuslabs.fi/
- **Osmosis Testnet:** https://testnet.osmosis.zone/

---

Успешного тестирования! 🚀

