# Frontend (React + Vite)

## Установка и запуск

```bash
cd frontend
npm i
npm run dev
```

По умолчанию UI откроется на `http://localhost:5173`.

## Что умеет UI
- Подключение Keplr к выбранной сети (RPC, chainId задаются вверху формы)
- Ввод адреса контракта и деноминации
- Запросы: `get_config`, `get_participant_status`, `get_stats`
- Действия участника: `register_participant`, `submit_task`, `claim_reward`
- Действия эмитента: `validate_task`, `deposit` (с прикреплением средств)
- Логи всех операций в нижнем блоке

## Подключение к локалнету
- Если запускаете локальный узел, укажите его RPC (например, `http://localhost:26657`) и `chainId`.
- Контрактный адрес — это адрес уже загруженного/инициализированного контракта в вашей сети.

## Переменные
- Никаких .env не требуется; всё задаётся в UI.

## Зависимости
- React 18, Vite 5, TypeScript 5
- CosmJS (@cosmjs/cosmwasm-stargate, @cosmjs/proto-signing)


